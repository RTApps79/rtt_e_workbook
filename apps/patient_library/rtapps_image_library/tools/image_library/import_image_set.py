#!/usr/bin/env python3
"""Import a de-identified DICOM/NIfTI image set into the RTApps static library.

The importer copies image files into a predictable GitHub Pages-safe structure,
groups DICOM instances by Series Instance UID, generates a per-set manifest,
and updates patient_library/image_sets/catalog.json.

This is an educational publishing helper, not a DICOM de-identification tool.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

try:
    import pydicom
    from pydicom.errors import InvalidDicomError
except ImportError:  # handled when DICOM files are encountered
    pydicom = None
    InvalidDicomError = Exception

SCHEMA_VERSION = 1
IMAGE_EXTENSIONS = {".dcm", ".dicom", ".ima", ".nii", ".gz"}
METADATA_EXTENSIONS = {".tcia", ".tsv", ".csv", ".json", ".txt"}
UNCOMPRESSED_TRANSFER_SYNTAXES = {
    "1.2.840.10008.1.2",      # Implicit VR Little Endian
    "1.2.840.10008.1.2.1",    # Explicit VR Little Endian
    "1.2.840.10008.1.2.1.99", # Deflated Explicit VR Little Endian (browser prototype may not decode)
}
DIRECT_IDENTIFIER_KEYWORDS = (
    "patientname", "patientid", "birthdate", "accessionnumber",
    "institutionname", "referringphysicianname",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def slugify(value: str, fallback: str = "series") -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value[:72] or fallback


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def normalized_posix(path: Path) -> str:
    return path.as_posix()


def discover_files(source: Path) -> list[Path]:
    return sorted(
        p for p in source.rglob("*")
        if p.is_file() and not any(part.startswith(".") for part in p.relative_to(source).parts)
    )


def is_nifti(path: Path) -> bool:
    lower = path.name.lower()
    return lower.endswith(".nii") or lower.endswith(".nii.gz")


def nifti_extension(path: Path) -> str:
    return ".nii.gz" if path.name.lower().endswith(".nii.gz") else ".nii"


def safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def dicom_sort_key(item: "DicomItem") -> tuple[int, float, str]:
    return item.instance_number, item.position_z, item.source.name.lower()


@dataclass
class DicomItem:
    source: Path
    series_uid: str
    study_uid: str
    sop_uid: str
    modality: str
    series_description: str
    study_description: str
    instance_number: int
    position_z: float
    rows: int
    columns: int
    number_of_frames: int
    transfer_syntax: str
    burned_in_annotation: str
    privacy_flags: dict[str, bool] = field(default_factory=dict)

    @property
    def loadable(self) -> bool:
        return self.rows > 0 and self.columns > 0

    @property
    def browser_compatible(self) -> bool:
        return self.loadable and self.transfer_syntax in {
            "1.2.840.10008.1.2", "1.2.840.10008.1.2.1"
        } and self.number_of_frames <= 1


def read_dicom_header(path: Path) -> DicomItem | None:
    if pydicom is None:
        return None

    tags = [
        "PatientName", "PatientID", "PatientBirthDate", "AccessionNumber",
        "InstitutionName", "ReferringPhysicianName", "StudyInstanceUID",
        "SeriesInstanceUID", "SOPInstanceUID", "Modality", "SeriesDescription",
        "StudyDescription", "InstanceNumber", "ImagePositionPatient", "Rows",
        "Columns", "NumberOfFrames", "BurnedInAnnotation",
    ]
    try:
        ds = pydicom.dcmread(path, stop_before_pixels=True, force=True, specific_tags=tags)
    except (InvalidDicomError, OSError, ValueError):
        return None

    # Avoid treating arbitrary text files as DICOM when force=True.
    series_uid = str(getattr(ds, "SeriesInstanceUID", "") or "")
    modality = str(getattr(ds, "Modality", "") or "")
    if not series_uid and not modality and not hasattr(ds, "Rows"):
        return None

    pos = getattr(ds, "ImagePositionPatient", None)
    z = safe_float(pos[2], 0.0) if pos and len(pos) >= 3 else 0.0
    file_meta = getattr(ds, "file_meta", None)
    transfer_syntax = str(getattr(file_meta, "TransferSyntaxUID", "") or "")
    privacy_flags = {
        key: bool(str(getattr(ds, attr, "") or "").strip())
        for key, attr in (
            ("PatientName", "PatientName"),
            ("PatientID", "PatientID"),
            ("PatientBirthDate", "PatientBirthDate"),
            ("AccessionNumber", "AccessionNumber"),
            ("InstitutionName", "InstitutionName"),
            ("ReferringPhysicianName", "ReferringPhysicianName"),
        )
    }

    return DicomItem(
        source=path,
        series_uid=series_uid or f"missing-series-{hashlib.sha1(str(path.parent).encode()).hexdigest()[:12]}",
        study_uid=str(getattr(ds, "StudyInstanceUID", "") or ""),
        sop_uid=str(getattr(ds, "SOPInstanceUID", "") or ""),
        modality=modality or "DICOM",
        series_description=str(getattr(ds, "SeriesDescription", "") or "").strip(),
        study_description=str(getattr(ds, "StudyDescription", "") or "").strip(),
        instance_number=safe_int(getattr(ds, "InstanceNumber", 0), 0),
        position_z=z,
        rows=safe_int(getattr(ds, "Rows", 0), 0),
        columns=safe_int(getattr(ds, "Columns", 0), 0),
        number_of_frames=max(1, safe_int(getattr(ds, "NumberOfFrames", 1), 1)),
        transfer_syntax=transfer_syntax,
        burned_in_annotation=str(getattr(ds, "BurnedInAnnotation", "") or "").strip().upper(),
        privacy_flags=privacy_flags,
    )


def copy_with_record(source: Path, target: Path, relative_to_set: Path) -> dict[str, Any]:
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    return {
        "path": normalized_posix(target.relative_to(relative_to_set)),
        "sizeBytes": target.stat().st_size,
        "sha256": sha256(target),
        "sourceName": source.name,
    }


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=".", help="Root of the rtt_e_workbook repository")
    parser.add_argument("--source", required=True, help="Downloaded DICOM/NIfTI folder")
    parser.add_argument("--set-id", required=True, help="Stable lowercase identifier, e.g. ea1141-case-001")
    parser.add_argument("--title", required=True, help="Display title")
    parser.add_argument("--patient-alias", required=True, help="De-identified alias displayed in the library")
    parser.add_argument("--site", default="", help="Anatomic site or educational category")
    parser.add_argument("--diagnosis", default="", help="Optional educational diagnosis label")
    parser.add_argument("--description", default="", help="Optional description")
    parser.add_argument("--source-label", default="", help="Dataset/source label, e.g. TCIA EA1141")
    parser.add_argument("--source-metadata", nargs="*", default=[], help="Optional .tcia/.tsv/.csv files to copy")
    parser.add_argument("--confirm-deidentified", action="store_true", help="Required acknowledgement before publishing")
    parser.add_argument("--replace", action="store_true", help="Replace an existing image-set directory")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = Path(args.repo_root).expanduser().resolve()
    source = Path(args.source).expanduser().resolve()
    set_id = slugify(args.set_id, "image-set")
    if set_id != args.set_id:
        print(f"ERROR: --set-id must already be URL-safe. Suggested value: {set_id}", file=sys.stderr)
        return 2
    if not source.is_dir():
        print(f"ERROR: source folder not found: {source}", file=sys.stderr)
        return 2
    if not args.confirm_deidentified:
        print(
            "ERROR: Publishing medical images requires an explicit de-identification acknowledgement.\n"
            "Review headers, private tags, filenames, metadata, and burned-in pixel annotations, then rerun with\n"
            "--confirm-deidentified. This script does not de-identify the source files.",
            file=sys.stderr,
        )
        return 2

    library_root = repo_root / "patient_library" / "image_sets"
    set_root = library_root / set_id
    if set_root.exists():
        if not args.replace:
            print(f"ERROR: {set_root} already exists. Use --replace to overwrite it.", file=sys.stderr)
            return 2
        shutil.rmtree(set_root)
    set_root.mkdir(parents=True, exist_ok=True)

    source_files = discover_files(source)
    dicom_items: list[DicomItem] = []
    nifti_files: list[Path] = []
    unrecognized: list[str] = []

    for path in source_files:
        if is_nifti(path):
            nifti_files.append(path)
            continue
        item = read_dicom_header(path)
        if item:
            dicom_items.append(item)
        elif path.suffix.lower() not in METADATA_EXTENSIONS:
            unrecognized.append(str(path.relative_to(source)))

    likely_dicom = [p for p in source_files if p.suffix.lower() in {".dcm", ".dicom", ".ima"}]
    if likely_dicom and pydicom is None:
        print(
            "ERROR: DICOM files were found but pydicom is not installed. Run:\n"
            "  python -m pip install -r tools/image_library/requirements.txt",
            file=sys.stderr,
        )
        shutil.rmtree(set_root, ignore_errors=True)
        return 2
    if not dicom_items and not nifti_files:
        print("ERROR: no readable DICOM or NIfTI files were found.", file=sys.stderr)
        shutil.rmtree(set_root, ignore_errors=True)
        return 2

    series_groups: dict[str, list[DicomItem]] = defaultdict(list)
    for item in dicom_items:
        series_groups[item.series_uid].append(item)

    series_manifest: list[dict[str, Any]] = []
    privacy_counts: dict[str, int] = defaultdict(int)
    burned_in_yes = 0
    total_bytes = 0
    used_slugs: set[str] = set()

    def unique_slug(base: str) -> str:
        candidate = base
        index = 2
        while candidate in used_slugs:
            candidate = f"{base}-{index}"
            index += 1
        used_slugs.add(candidate)
        return candidate

    for series_uid, items in sorted(series_groups.items(), key=lambda pair: (
        pair[1][0].modality, pair[1][0].series_description, pair[0]
    )):
        items.sort(key=dicom_sort_key)
        first = items[0]
        base = slugify(f"{first.modality}-{first.series_description}", slugify(first.modality, "dicom"))
        series_id = unique_slug(base)
        records = []
        for index, item in enumerate(items, start=1):
            for key, present in item.privacy_flags.items():
                if present:
                    privacy_counts[key] += 1
            if item.burned_in_annotation == "YES":
                burned_in_yes += 1
            target = set_root / "series" / series_id / f"{index:06d}.dcm"
            record = copy_with_record(item.source, target, set_root)
            record.update({
                "instanceNumber": item.instance_number,
                "sopInstanceUID": item.sop_uid,
            })
            records.append(record)
            total_bytes += record["sizeBytes"]

        compatible_count = sum(1 for item in items if item.browser_compatible)
        series_manifest.append({
            "id": series_id,
            "label": first.series_description or f"{first.modality} series",
            "format": "dicom",
            "modality": first.modality,
            "studyDescription": first.study_description,
            "studyInstanceUID": first.study_uid,
            "seriesInstanceUID": series_uid,
            "loadable": any(item.loadable for item in items),
            "prototypeViewerCompatible": compatible_count == len(items),
            "compatibilityNote": (
                "uncompressed single-frame DICOM"
                if compatible_count == len(items)
                else "Contains non-image, compressed, big-endian, deflated, or multi-frame DICOM; the starter OIS may not render every object."
            ),
            "instanceCount": len(records),
            "files": records,
        })

    for index, path in enumerate(nifti_files, start=1):
        base = slugify(path.name.replace(".nii.gz", "").replace(".nii", ""), f"nifti-{index}")
        series_id = unique_slug(base)
        ext = nifti_extension(path)
        target = set_root / "series" / series_id / f"volume{ext}"
        record = copy_with_record(path, target, set_root)
        total_bytes += record["sizeBytes"]
        series_manifest.append({
            "id": series_id,
            "label": path.name,
            "format": "nifti",
            "modality": "SEG" if re.search(r"seg|label|mask", path.name, re.I) else "MR",
            "loadable": True,
            "prototypeViewerCompatible": True,
            "instanceCount": 1,
            "files": [record],
        })

    metadata_records = []
    for raw in args.source_metadata:
        meta_source = Path(raw).expanduser().resolve()
        if not meta_source.is_file():
            print(f"WARNING: source metadata not found: {meta_source}", file=sys.stderr)
            continue
        target = set_root / "metadata" / meta_source.name
        record = copy_with_record(meta_source, target, set_root)
        metadata_records.append(record)
        total_bytes += record["sizeBytes"]

    modalities = sorted({series["modality"] for series in series_manifest})
    default_series = next(
        (s["id"] for s in series_manifest if s["loadable"] and s["prototypeViewerCompatible"]),
        next((s["id"] for s in series_manifest if s["loadable"]), ""),
    )
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "id": set_id,
        "title": args.title,
        "description": args.description,
        "educationalUseOnly": True,
        "generatedAt": utc_now(),
        "patient": {
            "alias": args.patient_alias,
            "site": args.site,
            "diagnosis": args.diagnosis,
        },
        "source": {
            "label": args.source_label,
            "metadataFiles": metadata_records,
        },
        "modalities": modalities,
        "defaultSeriesId": default_series,
        "series": series_manifest,
        "summary": {
            "seriesCount": len(series_manifest),
            "fileCount": sum(len(s["files"]) for s in series_manifest),
            "totalBytes": total_bytes,
        },
        "privacyReview": {
            "confirmedDeidentifiedByImporter": True,
            "headerFieldsPresentCounts": dict(sorted(privacy_counts.items())),
            "burnedInAnnotationYesCount": burned_in_yes,
            "warning": "Automated checks are incomplete. Confirm private tags, filenames, overlays, structured reports, and burned-in pixels before publishing.",
        },
        "unrecognizedSourceFiles": unrecognized,
    }
    write_json(set_root / "manifest.json", manifest)

    catalog_path = library_root / "catalog.json"
    catalog = load_json(catalog_path, {"schemaVersion": SCHEMA_VERSION, "generatedAt": utc_now(), "imageSets": []})
    catalog.setdefault("imageSets", [])
    catalog["schemaVersion"] = SCHEMA_VERSION
    catalog["generatedAt"] = utc_now()
    entry = {
        "id": set_id,
        "title": args.title,
        "patientAlias": args.patient_alias,
        "site": args.site,
        "diagnosis": args.diagnosis,
        "modalities": modalities,
        "manifest": f"{set_id}/manifest.json",
        "seriesCount": len(series_manifest),
        "fileCount": manifest["summary"]["fileCount"],
        "totalBytes": total_bytes,
    }
    catalog["imageSets"] = [item for item in catalog["imageSets"] if item.get("id") != set_id]
    catalog["imageSets"].append(entry)
    catalog["imageSets"].sort(key=lambda item: (item.get("site", ""), item.get("title", ""), item.get("id", "")))
    write_json(catalog_path, catalog)

    print(f"Imported image set: {set_id}")
    print(f"  DICOM instances: {len(dicom_items)}")
    print(f"  NIfTI volumes:    {len(nifti_files)}")
    print(f"  Series:           {len(series_manifest)}")
    print(f"  Bytes copied:     {total_bytes:,}")
    print(f"  Manifest:         {set_root / 'manifest.json'}")
    if privacy_counts or burned_in_yes:
        print("WARNING: privacy review flags were detected; inspect privacyReview in manifest.json.")
    if any(not s["prototypeViewerCompatible"] for s in series_manifest):
        print("WARNING: at least one series is not fully compatible with the starter OIS viewer.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
