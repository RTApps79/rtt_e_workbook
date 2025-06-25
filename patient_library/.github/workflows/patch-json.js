// patch-json.js
// This script checks and fixes missing EMR fields in patient JSON files

const fs = require('fs');
const path = require('path');

const PATIENT_DIR = path.join(__dirname, 'patient_library');
const REQUIRED_FIELDS = {
  demographics: {},
  diagnosis: {},
  treatmentPlan: {},
  imagingAndReports: [],
  labResults: [],
  progressNotes: [],
  patientEducation: [],
  scheduling: [],
  cptCharges: [],
  radOnc: {
    ctsim: {},
    dosimetry: {},
    treatmentDelivery: {}
  }
};

let patchedFiles = 0;

fs.readdir(PATIENT_DIR, (err, files) => {
  if (err) throw err;

  files.filter(f => f.endsWith('.json')).forEach(filename => {
    const filePath = path.join(PATIENT_DIR, filename);
    let content;

    try {
      content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error(`❌ Error reading ${filename}: ${e.message}`);
      return;
    }

    let modified = false;

    for (const [key, defaultVal] of Object.entries(REQUIRED_FIELDS)) {
      if (!(key in content)) {
        content[key] = defaultVal;
        modified = true;
      } else if (key === 'radOnc') {
        for (const subKey of ['ctsim', 'dosimetry', 'treatmentDelivery']) {
          if (!(subKey in content.radOnc)) {
            content.radOnc[subKey] = {};
            modified = true;
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      console.log(`✅ Patched: ${filename}`);
      patchedFiles++;
    } else {
      console.log(`✔️  OK: ${filename}`);
    }
  });

  if (patchedFiles === 0) {
    console.log("All files already valid. No changes made.");
  } else {
    console.log(`\n🩹 Patch complete. ${patchedFiles} file(s) updated.`);
  }
});
