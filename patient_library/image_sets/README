# RTApps image-set library

This directory is the static image library served by GitHub Pages.

Each imported case has this shape:

```text
image_sets/
  catalog.json
  ea1141-case-001/
    manifest.json
    metadata/
      source-manifest.tcia
      treatment-data.tsv
    series/
      ct-planning/
        000001.dcm
        000002.dcm
      rt-dose/
        000001.dcm
      segmentation/
        volume.nii.gz
```

Do not manually type long image URL lists. Run `tools/image_library/import_image_set.py`; it copies files, calculates hashes, creates the case manifest, and updates `catalog.json`.

Only publish image data that has been reviewed and approved for public educational use. The importer does not remove identifiers, private DICOM tags, overlays, or burned-in pixel annotations.
