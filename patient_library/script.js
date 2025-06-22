const form = document.getElementById('patientForm');
const table = document.getElementById('patientTable');

form.addEventListener('submit', function(event) {
  event.preventDefault();
  const name = document.getElementById('name').value;
  const age = document.getElementById('age').value;
  const treatment = document.getElementById('treatment').value;

  const row = table.insertRow();
  row.insertCell(0).textContent = name;
  row.insertCell(1).textContent = age;
  row.insertCell(2).textContent = treatment;

  form.reset();
});

function submitDailyRecord() {
  let summary = "Generic Daily Radiation Treatment Record\n";
  summary += "=========================================\n\n";

  summary += "**Patient & Session Information**\n";
  summary += "Patient Name: " + (document.getElementById('patientName')?.value || 'N/A') + "\n";
  summary += "Patient ID/MRN: " + (document.getElementById('patientId')?.value || 'N/A') + "\n";
  summary += "Fraction: " + (document.getElementById('fractionNumCurrent')?.value || 'N/A') + " / " + (document.getElementById('fractionNumTotal')?.value || 'N/A') + "\n";
  summary += "Treatment Date: " + (document.getElementById('treatmentDate')?.value || 'N/A') + "\n";
  summary += "Treatment Machine: " + (document.getElementById('machine')?.value || 'N/A') + "\n\n";

  summary += "**Treatment Parameters**\n";
  summary += "Fields & MUs: " + (document.getElementById('fieldsAndMUs')?.value || 'N/A') + "\n";
  summary += "Energies Used: " + (document.getElementById('energiesUsed')?.value || 'N/A') + "\n\n";

  summary += "**Image Guidance (IGRT)**\n";
  summary += "Imaging Type: " + (document.getElementById('imagingType')?.value || 'N/A') + "\n";
  summary += "Match Quality/Verification: " + (document.getElementById('igrtMatchQuality')?.value || 'N/A') + "\n";
  summary += "Shifts Applied: " + (document.getElementById('shiftsApplied')?.value || 'N/A') + "\n";
  summary += "IGRT Approved By: " + (document.getElementById('igrtApprovedBy')?.value || 'N/A') + "\n";
  summary += "IGRT Verification Notes: " + (document.getElementById('igrtVerificationNotes')?.value || 'N/A') + "\n\n";

  summary += "**Positioning & Immobilization**\n";
  summary += "Setup Verification: " + (document.getElementById('setupVerification')?.value || 'N/A') + "\n";
  summary += "Immobilization Devices Checked: " + (document.getElementById('immobilizationDevicesChecked')?.value || 'N/A') + "\n";
  summary += "Setup Adjustments: " + (document.getElementById('setupAdjustments')?.value || 'N/A') + "\n";
  summary += "Organ/Target Checks: " + (document.getElementById('organTargetChecks')?.value || 'N/A') + "\n\n";

  summary += "**Patient Assessment**\n";
  summary += "Patient Tolerance: " + (document.getElementById('patientTolerance')?.value || 'N/A') + "\n";
  summary += "General Side Effects: " + (document.getElementById('generalSideEffects')?.value || 'N/A') + "\n";
  summary += "Site-Specific Side Effects: " + (document.getElementById('siteSpecificSideEffects')?.value || 'N/A') + "\n";
  summary += "Pain Assessment: " + (document.getElementById('painAssessment')?.value || 'N/A') + "\n";
  summary += "Patient Concerns: " + (document.getElementById('patientConcerns')?.value || 'N/A') + "\n";
  summary += "Instructions Given: " + (document.getElementById('instructionsGiven')?.value || 'N/A') + "\n\n";

  summary += "**Record Keeping**\n";
  summary += "Therapist(s): " + (document.getElementById('therapistInitials')?.value || 'N/A') + "\n";
  summary += "Billing Codes: " + (document.getElementById('billingCodes')?.value || 'N/A') + "\n";
  summary += "Daily Notes: " + (document.getElementById('dailyNotes')?.value || 'N/A') + "\n";

  const outputDiv = document.getElementById('submissionOutput');
  const summaryTextArea = document.getElementById('submissionSummary');
  summaryTextArea.value = summary;
  outputDiv.style.display = 'block'; // Show the output area
  alert("Daily Record Summary prepared below. Please copy the text.");
}
