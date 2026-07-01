# RTApps GitHub image-library starter

This package adds a manifest-driven DICOM/NIfTI library to `RTApps79/rtt_e_workbook` and provides a modified copy of the attached Oncology Information System that can load a selected series from GitHub Pages.

## 1. Copy these files into the repository

From the root of your local `rtt_e_workbook` clone, copy/merge:

```text
.github/workflows/validate-image-library.yml
tools/image_library/
patient_library/image_sets/
oncology_information_system_library.html
reference_inputs/                         # optional; examples only
```

You may rename `oncology_information_system_library.html` after confirming it works. Its catalog URL is configured on the first line:

```html
<html lang="en" data-image-catalog="./patient_library/image_sets/catalog.json">
```

That path is correct when the OIS HTML file is in the repository root. Adjust it if you place the OIS in another directory.

## 2. Install the importer dependency

```powershell
cd C:\path\to\rtt_e_workbook
python -m pip install -r tools\image_library\requirements.txt
```

## 3. Download the actual image files

The attached `.tcia` file is a TCIA/NBIA download manifest. Open it with NBIA Data Retriever and download the DICOM series to a local folder. The `.tsv` file contains treatment metadata and can be stored alongside a case, but it does not contain images.

## 4. Import, validate, and commit one image set

The PowerShell helper performs all three operations:

```powershell
.\tools\image_library\add_image_set.ps1 `
  -Source "C:\TCIA\EA1141\downloaded-case-folder" `
  -SetId "ea1141-case-001" `
  -Title "EA1141 Case 001" `
  -PatientAlias "EA1141-001" `
  -Site "Breast" `
  -Diagnosis "Educational breast cancer case" `
  -SourceLabel "TCIA EA1141" `
  -SourceMetadata @(
    ".\reference_inputs\EA1141_v02_20260519.tcia",
    ".\reference_inputs\CFB-GBM_treatment_data_v02_20260129.tsv"
  ) `
  -CommitMessage "Add EA1141 image set 001"
```

Add `-Push` only when you also want the script to run `git push`.

The importer requires `-confirm-deidentified` internally. This is an acknowledgement, not an automated de-identification guarantee. Do not publish clinical images until headers, private tags, filenames, overlays, structured data, and burned-in annotations have been reviewed.

## 5. Manual Python alternative

```powershell
python tools\image_library\import_image_set.py `
  --repo-root . `
  --source "C:\TCIA\EA1141\downloaded-case-folder" `
  --set-id "ea1141-case-001" `
  --title "EA1141 Case 001" `
  --patient-alias "EA1141-001" `
  --site "Breast" `
  --source-label "TCIA EA1141" `
  --confirm-deidentified

python tools\image_library\validate_image_library.py --repo-root . --hashes

git add patient_library/image_sets tools/image_library .github/workflows/validate-image-library.yml oncology_information_system_library.html
git commit -m "Add manifest-driven image library"
git push
```

## What the code does

- Scans downloaded DICOM and NIfTI files.
- Groups DICOM instances by `SeriesInstanceUID`.
- Sorts slices by instance number and image position.
- Copies files into stable, sequential, URL-safe paths.
- Calculates SHA-256 hashes and file sizes.
- Creates one `manifest.json` per image set.
- Updates the central `catalog.json` used by the OIS.
- Warns when a series uses compressed, big-endian, deflated, or multi-frame DICOM that the starter viewer may not render.
- Validates missing files, duplicate IDs, hashes, directory width, and files that exceed GitHub's regular Git file limit.

## Important storage decision

For image sets intended to load through GitHub Pages, keep the actual browser-loaded files in regular Git and below GitHub's per-file limit. Git LFS is not suitable for files that the Pages site must directly serve. For large libraries, keep only manifests and representative teaching cases in this repo, and place bulk image data in a storage service designed for large static objects or a DICOMweb server.
