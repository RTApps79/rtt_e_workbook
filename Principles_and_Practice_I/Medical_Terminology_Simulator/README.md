# RTApps Terminology Builder — Improved Version

This package contains an improved browser-based medical terminology simulator derived from the uploaded prototype.

## Files

```text
medical_terminology_builder_improved/
  index.html
  README.md
  CHANGELOG.md
```

## How to use

Open `index.html` in any modern browser or upload the folder to GitHub Pages.

Recommended repo location:

```text
apps/terminology_builder/index.html
```

or, if you want it tied to a course module:

```text
curriculum/15_radiation_therapy_patient_care/terminology_builder/index.html
```

## Major features

- No external JavaScript or CSS dependencies.
- Responsive clinical dashboard layout.
- Six activity modes: Explorer, Assembly, Scenario, Match, Flashcards, and Quick Check.
- Generic tracks: General medical terminology, Oncology terminology, and Radiation therapy terminology.
- Generic anatomy scale focus: Cell, Tissue, Organ, and Human.
- Local progress tracking using browser localStorage.
- Exportable JSON progress summary.
- Print/save-to-PDF workflow.
- Drag/tap word-part assembly.
- Fixed scenario checking logic.
- Fixed missing DOM reference issues from the original prototype.

## Notes

This is an educational terminology simulator. It is not a clinical decision-support system and should not be used for patient-care decisions.
