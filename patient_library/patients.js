const patients = [
  { name: "John Smith (Primary Brain - Glioblastoma)", file: "John_Smith_PrimaryBrainGlioblastoma.json", diagnosis: "Glioblastoma" },
  { name: "Maria Garcia (Palliative Brain Mets)", file: "Maria_Garcia_PalliativeBrainMets.json", diagnosis: "Brain Metastases" },
  { name: "Sarah Chen (Head and Neck - Multi-field IMRT)", file: "Sarah_Chen_HeadNeckIMRT.json", diagnosis: "Head and Neck Cancer" },
  { name: "David Garcia (Lung - 3D-CRT)", file: "David_Garcia_Lung3DCRT.json", diagnosis: "Lung Cancer" },
  { name: "Linda Jones (Thorax - IMRT/VMAT)", file: "Linda_Jones_ThoraxIMRT.json", diagnosis: "Lung Cancer" },
  { name: "Robert Miller (Thorax - SBRT)", file: "Robert_Miller_ThoraxSBRT.json", diagnosis: "Lung Cancer" },
  { name: "Mary Peterson (Breast - Tangents Only)", file: "Mary_Peterson_BreastTangents.json", diagnosis: "Breast Cancer" },
  { name: "Anna Bellwether (Breast - Boost Only)", file: "Anna_Bellwether_BreastBoost.json", diagnosis: "Breast Cancer" },
  { name: "Susan Miller (Breast - Prone Setup)", file: "Susan_Miller_BreastProne.json", diagnosis: "Breast Cancer" },
  { name: "David Garcia (Abdomen - Multi-field / Pancreas)", file: "David_Garcia_AbdomenPancreas.json", diagnosis: "Pancreatic Cancer" },
  { name: "James Wilson (Pelvis - Prostate Multi-field Supine)", file: "James_Wilson_PelvisProstate.json", diagnosis: "Prostate Cancer" },
  { name: "Elizabeth Green (Pelvis - Endometrial Multi-field Supine)", file: "Elizabeth_Green_PelvisEndometrial.json", diagnosis: "Endometrial Cancer" },
  { name: "Barbara Davis (Breast - Tangents + Supraclavicular)", file: "Barbara_Davis_BreastSCV.json", diagnosis: "Breast Cancer" },
  { name: "David Wilson (Pelvis - Anal Carcinoma - Supine)", file: "David_Wilson_AnalSupine.json", diagnosis: "Anal Carcinoma" },
  { name: "Michael Turner (Pelvis - Anal Carcinoma - Prone)", file: "Michael_Turner_AnalProne.json", diagnosis: "Anal Carcinoma" },
  { name: "George Harris (Skeletal - Metastatic Spine)", file: "George_Harris_SkeletalSpine.json", diagnosis: "Metastatic Spine Cancer" },
  { name: "Alice Brown (Skeletal - Metastatic Extremity)", file: "Alice_Brown_SkeletalExtremity.json", diagnosis: "Metastatic Extremity Cancer" },
  { name: "Kevin Young (Primary Bone - Extremity - Osteosarcoma)", file: "Kevin_Young_Osteosarcoma.json", diagnosis: "Osteosarcoma" },
  { name: "Susan Walker (Electron Fields - Single)", file: "Susan_Walker_ElectronSingle.json", diagnosis: "Skin Cancer (BCC)" },
  { name: "Henry Davis (Abutting Photon/Electron Fields)", file: "Henry_Davis_AbuttingFields.json", diagnosis: "Skin Cancer (SCCa Scalp)" },
  { name: "Michael Rivera (Hodgkin Lymphoma - Mantle)", file: "Michael_Rivera_HodgkinMantle.json", diagnosis: "Hodgkin Lymphoma" },
  { name: "Eleanor Vance (Hodgkin Lymphoma - Inverted Y)", file: "Eleanor_Vance_HodgkinInvertedY.json", diagnosis: "Hodgkin Lymphoma" },
  { name: "Samuel Green (Hodgkin Lymphoma - Above & Below)", file: "Samuel_Green_HodgkinAboveBelow.json", diagnosis: "Hodgkin Lymphoma" },
  { name: "Emily Carter (Pediatric Brain Tumor - Proton)", file: "Emily_Carter_PedsBrainProton.json", diagnosis: "Medulloblastoma" },
  { name: "Arthur Pendelton (Skull Base Chordoma - Proton)", file: "Arthur_Pendelton_ChordomaProton.json", diagnosis: "Chordoma" },
  { name: "Patricia Rodriguez (Lung Cancer - Proton)", file: "Patricia_Rodriguez_LungProton.json", diagnosis: "Lung Cancer" },
  { name: "Brenda Smith (Re-irradiation Head & Neck - Proton)", file: "Brenda_Smith_ReirradiationHNProton.json", diagnosis: "Recurrent Head and Neck Cancer" },
  { name: "Olivia Chen (Mycosis Fungoides - TSEBT)", file: "Olivia_Chen_MFTSEBT.json", diagnosis: "Mycosis Fungoides" },
  { name: "David Miller (Sézary Syndrome - Low Dose TSEBT)", file: "David_Miller_SezaryTSEBT.json", diagnosis: "Sézary Syndrome" },
  { name: "Carlos Jones Kaposi Sarcoma (HIV-Associated)", file: "Carlos_Jones_KaposiSarcoma.json", diagnosis: "Kaposi Sarcoma" },
  { name: "John Smith (AML with TBI for HCT)", file: "John_Smith_AML_TBI.json", diagnosis: "Acute Myeloid Leukemia (AML)" },
  { name: "Alice Johnson (Small Bowel Adenocarcinoma)", file: "Alice_Johnson_SmallBowelAdeno.json", diagnosis: "Small Bowel Adenocarcinoma" },
  { name: "Robert Smith (Colon Adenocarcinoma)", file: "Robert_Smith_ColonAdeno1.json", diagnosis: "Colon Cancer" },
  { name: "Maria Garcia (Rectal Adenocarcinoma)", file: "Maria_Garcia_RectalAdeno.json", diagnosis: "Rectal Cancer" },
  { name: "David Lee (Small Bowel Adenocarcinoma)", file: "David_Lee_SmallBowelAdeno.json", diagnosis: "Small Bowel Adenocarcinoma" },
  { name: "John Doe (Malignant Spinal Cord Compression)", file: "John_Doe_MSCC.json", diagnosis: "Malignant Spinal Cord Compression" },
  { name: "Jane Smith (Superior Vena Cava Syndrome)", file: "Jane_Smith_SVCS.json", diagnosis: "Superior Vena Cava Syndrome" }
];

// Patient Dropdown and Search functions from your file
function populatePatientDropdown(filteredPatients = patients) {
  const select = document.getElementById('patientSelect');
  if (!select) return;
  select.innerHTML = ""; // Clear existing options
  
  if (filteredPatients.length === 0) {
    const opt = document.createElement('option');
    opt.value = "";
    opt.textContent = "No patients found";
    select.appendChild(opt);
    return;
  }
  
  filteredPatients.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.file;
    opt.textContent = p.name;
    select.appendChild(opt);
  });
}

function filterPatientsByDiagnosis() {
  const searchValue = document.getElementById('diagnosisSearch').value.trim().toLowerCase();
  
  if (searchValue === "") {
    populatePatientDropdown(patients);
    if (patients && patients.length > 0) {
        // Trigger a change to load the first patient of the full list
        document.getElementById('patientSelect').dispatchEvent(new Event('change'));
    }
    return;
  }
  
  const filtered = patients.filter(p =>
    p.diagnosis && p.diagnosis.toLowerCase().includes(searchValue)
  );
  
  populatePatientDropdown(filtered);
  
  // After filtering, automatically load the first patient in the filtered list
  if (filtered.length > 0) {
    loadAndDisplayPatient(filtered[0].file);
  } else {
    // If no patients are found, clear the EMR display
    const tabContents = document.getElementById('emr-tab-contents');
    const tabsDiv = document.getElementById('emr-tabs');
    if(tabContents) tabContents.innerHTML = "<p>No matching patients found.</p>";
    if(tabsDiv) tabsDiv.innerHTML = "";
  }
}

// Initialize on Page Load
document.addEventListener('DOMContentLoaded', () => {
    // This listener is in your emr.js file, which will call the initial load.
    // If this script loads first, this ensures the dropdown is ready.
    populatePatientDropdown();
});
