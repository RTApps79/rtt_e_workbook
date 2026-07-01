#!/usr/bin/env python3
"""Validate RTApps image-set catalog, manifests, files, hashes, and GitHub limits."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

HARD_FILE_LIMIT = 100 * 1024 * 1024
WEB_UPLOAD_LIMIT = 25 * 1024 * 1024
RECOMMENDED_DIRECTORY_WIDTH = 3000


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", default=".")
    parser.add_argument("--hashes", action="store_true", help="Recalculate SHA-256 hashes (slower)")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    library_root = repo_root / "patient_library" / "image_sets"
    catalog_path = library_root / "catalog.json"
    errors: list[str] = []
    warnings: list[str] = []

    if not catalog_path.is_file():
        errors.append(f"Missing catalog: {catalog_path}")
    else:
        try:
            catalog = load_json(catalog_path)
        except Exception as exc:
            errors.append(f"Invalid catalog JSON: {exc}")
            catalog = {"imageSets": []}

        entries = catalog.get("imageSets", [])
        ids = [entry.get("id", "") for entry in entries]
        duplicates = [item for item, count in Counter(ids).items() if item and count > 1]
        if duplicates:
            errors.append(f"Duplicate image-set IDs: {', '.join(duplicates)}")

        for entry in entries:
            set_id = entry.get("id", "<missing-id>")
            manifest_rel = entry.get("manifest")
            if not manifest_rel:
                errors.append(f"{set_id}: missing manifest path")
                continue
            manifest_path = library_root / manifest_rel
            if not manifest_path.is_file():
                errors.append(f"{set_id}: manifest does not exist: {manifest_rel}")
                continue
            try:
                manifest = load_json(manifest_path)
            except Exception as exc:
                errors.append(f"{set_id}: invalid manifest JSON: {exc}")
                continue
            if manifest.get("id") != set_id:
                errors.append(f"{set_id}: manifest id is {manifest.get('id')!r}")
            series_ids = [series.get("id", "") for series in manifest.get("series", [])]
            dup_series = [item for item, count in Counter(series_ids).items() if item and count > 1]
            if dup_series:
                errors.append(f"{set_id}: duplicate series IDs: {', '.join(dup_series)}")

            for series in manifest.get("series", []):
                series_id = series.get("id", "<missing-series-id>")
                for record in series.get("files", []):
                    rel = record.get("path") if isinstance(record, dict) else record
                    if not rel:
                        errors.append(f"{set_id}/{series_id}: file record missing path")
                        continue
                    file_path = (manifest_path.parent / rel).resolve()
                    try:
                        file_path.relative_to(manifest_path.parent.resolve())
                    except ValueError:
                        errors.append(f"{set_id}/{series_id}: path escapes image-set directory: {rel}")
                        continue
                    if not file_path.is_file():
                        errors.append(f"{set_id}/{series_id}: missing file {rel}")
                        continue
                    with file_path.open("rb") as handle:
                        prefix = handle.read(128)
                    if prefix.startswith(b"version https://git-lfs.github.com/spec/v1"):
                        errors.append(f"{set_id}/{series_id}: {rel} is a Git LFS pointer; GitHub Pages cannot serve the image bytes")
                        continue
                    size = file_path.stat().st_size
                    if size > HARD_FILE_LIMIT:
                        errors.append(f"{set_id}/{series_id}: {rel} is larger than 100 MiB")
                    elif size > WEB_UPLOAD_LIMIT:
                        warnings.append(f"{set_id}/{series_id}: {rel} is larger than 25 MiB; add it with Git, not the browser uploader")
                    expected_size = record.get("sizeBytes") if isinstance(record, dict) else None
                    if expected_size is not None and expected_size != size:
                        errors.append(f"{set_id}/{series_id}: size mismatch for {rel}")
                    if args.hashes and isinstance(record, dict) and record.get("sha256"):
                        actual = digest(file_path)
                        if actual != record["sha256"]:
                            errors.append(f"{set_id}/{series_id}: SHA-256 mismatch for {rel}")

    for directory in library_root.rglob("*") if library_root.exists() else []:
        if directory.is_dir():
            width = sum(1 for _ in directory.iterdir())
            if width > RECOMMENDED_DIRECTORY_WIDTH:
                warnings.append(f"Directory has {width} entries (recommended maximum 3000): {directory.relative_to(repo_root)}")

    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)

    if errors:
        print(f"Validation failed: {len(errors)} error(s), {len(warnings)} warning(s).", file=sys.stderr)
        return 1
    print(f"Validation passed: {len(warnings)} warning(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
