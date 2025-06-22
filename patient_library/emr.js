// --- EMR Tabs and Sub-Tabs ---
const emrTabs = [
  { key: "demographics", label: "Demographics" },
  { key: "diagnosis", label: "Diagnosis & Staging" },
  { key: "treatmentPlan", label: "Treatment Plan" },
  { key: "imagingAndReports", label: "Imaging & Reports" },
  { key: "labResults", label: "Lab Results" },
  { key: "progressNotes", label: "Progress Notes" },
  { key: "patientEducation", label: "Patient Education" },
  { key: "scheduling", label: "Scheduling" },
  { key: "cptCharges", label: "CPT Charges" },
  { key: "radOnc", label: "Radiation Oncology" }
];

const radOncSubTabs = [
  { key: "ctsim", label: "CT Simulation" },
  { key: "dosimetry", label: "Dosimetry/Physics" },
  { key: "treatmentDelivery", label: "Treatment Delivery" }
];

// --- Section Renderers ---
function renderDemographics(data) {
  console.log("Demographics data received:", data.demographics);
  const d = data.demographics || {};
  return `
    <h3>Patient Demographics</h3>
    <table class="demographics-table">
      <tr><th>Name:</th><td>${d.name || ""}</td></tr>
      <tr><th>Date of Birth:</th><td>${d.dob || ""}</td></tr>
      <tr><th>Gender:</th><td>${d.gender || ""}</td></tr>
      <tr><th>Address:</th><td>${d.address || ""}</td></tr>
      <tr><th>Phone:</th><td>${d.phone || ""}</td></tr>
      <tr><th>Insurance:</th><td>${d.insurance || ""}</td></tr>
      <tr><th>Referring Physician:</th><td>${d.referringPhysician || ""}</td></tr>
      <tr><th>Emergency Contact:</th><td>${d.emergencyContact || ""}</td></tr>
      <tr><th>Advance Directives:</th><td>${d.advanceDirectives || ""}</td></tr>
      <tr><th>Support Services:</th><td>${d.supportServices || ""}</td></tr>
      <tr><th>Mobility:</th><td>${d.mobility || ""}</td></tr>
    </table>
  `;
}
function renderDiagnosis(data) {
  const d = data.diagnosis || {};
  return `<h3>Diagnosis & Staging</h3>
    <p><strong>Primary Diagnosis:</strong> ${d.primary || ""}</p>
    <p><strong>Location:</strong> ${d.location || ""}</p>
    <p><strong>Date Pathologic Diagnosis:</strong> ${d.datePathologicDiagnosis || ""}</p>`;
}
function renderTreatmentPlan(data) {
  const t = data.treatmentPlan || {};
  return `<h3>Treatment Plan</h3>
    <p><strong>Intent:</strong> ${t.intent || ""}</p>
    <p><strong>Modality:</strong> ${t.modality || ""}</p>
    <p><strong>Total Dose:</strong> ${t.totalDose || ""}</p>
    <p><strong>Fractionation:</strong> ${t.fractionation || ""}</p>`;
}
function renderLabResults(data) {
  const l = data.labResults || [];
  if (!l.length) return `<h3>Lab Results</h3><p>No lab results for this patient.</p>`;
  return `<h3>Lab Results</h3>
    <table>
      <thead><tr><th>Date</th><th>Test</th><th>Value</th><th>Units</th><th>Notes</th></tr></thead>
      <tbody>
        ${l.map(res => `
          <tr>
            <td>${res.date || ""}</td>
            <td>${res.test || ""}</td>
            <td>${res.value || ""}</td>
            <td>${res.units || ""}</td>
            <td>${res.notes || ""}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}
function renderProgressNotes(data) {
  const notes = data.progressNotes || [];
  if (!notes.length) return `<h3>Progress Notes</h3><p>No progress notes for this patient.</p>`;
  return `<h3>Progress Notes</h3>
    <ul>
      ${notes.map(n => `<li><strong>${n.date}:</strong> ${n.summary || n.note || ""}</li>`).join('')}
    </ul>`;
}
function renderPatientEducation(data) {
  const pe = data.patientEducation || {};
  if (Object.keys(pe).length === 0) return `<h3>Patient Education</h3><p>No patient education materials for this patient.</p>`;
  return `<h3>Patient Education</h3>
    <ul>
      ${pe.goalsDiscussed ? `<li><strong>Goals Discussed:</strong> ${pe.goalsDiscussed}</li>` : ""}
      ${pe.sideEffectsReviewed ? `<li><strong>Side Effects Reviewed:</strong> ${pe.sideEffectsReviewed}</li>` : ""}
      ${pe.safetyConsiderations ? `<li><strong>Safety Considerations:</strong> ${pe.safetyConsiderations}</li>` : ""}
      ${pe.patientResponsibilities ? `<li><strong>Patient Responsibilities:</strong> ${pe.patientResponsibilities}</li>` : ""}
      ${pe.medicationCompliance ? `<li><strong>Medication Compliance:</strong> ${pe.medicationCompliance}</li>` : ""}
    </ul>`;
}
function renderScheduling(data) {
  const sched = data.scheduling || [];
  if (!sched.length) return `<h3>Scheduling</h3><p>No appointments scheduled.</p>`;
  return `<h3>Scheduling</h3>
    <table>
      <thead><tr><th>Date</th><th>Type</th><th>Location</th><th>Status</th></tr></thead>
      <tbody>
        ${sched.map(a => `
          <tr>
            <td>${a.date || ""}</td>
            <td>${a.type || ""}</td>
            <td>${a.location || ""}</td>
            <td>${a.status || ""}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}
function renderCptCharges(data) {
  const cpt = data.cptCharges || [];
  if (!cpt.length) return `<h3>CPT Charges</h3><p>No CPT codes recorded.</p>`;
  return `<h3>CPT Charges</h3>
    <table>
      <thead><tr><th>Code</th><th>Description</th><th>Frequency</th></tr></thead>
      <tbody>
        ${cpt.map(c => `
          <tr>
            <td>${c.code || ""}</td>
            <td>${c.description || ""}</td>
            <td>${c.frequency || ""}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}
function renderImagingAndReportsTab(data) {
  const reports = data.imagingAndReports || [];
  const dicomSection = renderDicomImagesSection(data.dicomImages || []);
  let html = `<h3>Imaging & Reports</h3>`;
  if (reports.length) {
    html += `<ul>`;
    reports.forEach(rep => {
      html += `<li>
        <strong>${rep.date} - ${rep.type}:</strong> ${rep.summary || ""}
        ${rep.reportDetails && rep.reportDetails.imageSrc ? `<br><img src="${rep.reportDetails.imageSrc}" alt="Imaging" style="max-width:200px;">` : ""}
        ${rep.reportDetails && rep.reportDetails.fullSummary ? `<br><em>${rep.reportDetails.fullSummary}</em>` : ""}
      </li>`;
    });
    html += `</ul>`;
  } else {
    html += `<p>No imaging reports for this patient.</p>`;
  }
  html += `<h4>DICOM Images</h4>${dicomSection}`;
  return html;
}
// --- Imaging & DICOM Integration ---
function renderDicomImagesSection(dicomImages = []) {
  if (!dicomImages.length) return '<p>No DICOM images for this patient.</p>';
  return dicomImages.map((img, i) => {
    let buttons = '';
    if (img.imageUrls && img.imageUrls.length) {
      buttons += `<button onclick="window.loadDicomSeries(${i})">View in App</button> `;
    }
    if (img.ohifViewerUrl) {
      buttons += `<a href="${img.ohifViewerUrl}" target="_blank" rel="noopener">View in OHIF Viewer</a> `;
      buttons += `<button onclick="window.embedOhifViewer('${img.ohifViewerUrl}')">Embed in Chart</button>`;
    }
    if (!buttons) {
      buttons = '<em>No images available for this series.</em>';
    }
    return `
      <div style="margin-bottom:1em;">
        <strong>${img.description || 'DICOM Series'}</strong> (${img.seriesType || 'Unknown'})
        ${buttons}
      </div>
    `;
  }).join('');
}
window.embedOhifViewer = function(viewerUrl) {
  const overlay = document.getElementById('emr-modal-overlay');
  overlay.style.display = 'flex';
  const viewer = document.getElementById('dicom-viewer');
  viewer.innerHTML = `<iframe src="${viewerUrl}" width="100%" height="600" style="border: none;"></iframe>`;
};
window.loadDicomSeries = function(seriesIdx) {
  const series = currentPatientData.dicomImages[seriesIdx];
  if (!series || !series.imageUrls || !series.imageUrls.length) {
    alert("No images found for this series.");
    return;
  }
  document.getElementById('emr-modal-overlay').style.display = 'flex';
  const element = document.getElementById('dicom-viewer');
  cornerstone.enable(element);
  const imageIds = series.imageUrls.map(url => 'wadouri:' + url);
  cornerstone.loadAndCacheImage(imageIds[0]).then(function(image) {
    cornerstone.displayImage(element, image);
    const stack = { currentImageIdIndex: 0, imageIds: imageIds };
    cornerstoneTools.addStackStateManager(element, ['stack']);
    cornerstoneTools.addToolState(element, 'stack', stack);
    cornerstoneTools.init();
    cornerstoneTools.addTool(cornerstoneTools.StackScrollMouseWheelTool);
    cornerstoneTools.addTool(cornerstoneTools.WwwcTool);
    cornerstoneTools.addTool(cornerstoneTools.PanTool);
    cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
    cornerstoneTools.addTool(cornerstoneTools.LengthTool);
    cornerstoneTools.addTool(cornerstoneTools.AngleTool);
    cornerstoneTools.setToolActive('StackScrollMouseWheel', {});
    cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
    cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 2 });
    cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 4 });
    cornerstoneTools.setToolActive('Length', { mouseButtonMask: 1, isTouchActive: false });
    cornerstoneTools.setToolActive('Angle', { mouseButtonMask: 1, isTouchActive: false });
  }, function(err) {
    alert("Error loading DICOM: " + err);
  });
};

// Modal close button
document.addEventListener('DOMContentLoaded', function() {
  const closeBtn = document.getElementById('emr-modal-close');
  if (closeBtn) {
    closeBtn.onclick = function() {
      document.getElementById('emr-modal-overlay').style.display = 'none';
      document.getElementById('dicom-viewer').innerHTML = "";
    };
  }
});
function renderCTSimulation(ct) {
  if (!ct) return `<p>No CT Simulation data for this patient.</p>`;
  return `<h3>CT Simulation</h3>
    <p><strong>Simulation Date:</strong> ${ct.simulationDate || ""}</p>
    <p><strong>Setup Instructions:</strong> ${ct.setupInstructions || ""}</p>
    <p><strong>Immobilization:</strong> ${ct.immobilization || ""}</p>
    <p><strong>Reference Marks:</strong> ${ct.referenceMarks || ""}</p>
    <p><strong>Scanner:</strong> ${ct.scanner || ""}</p>
    <p><strong>Slice Thickness:</strong> ${ct.sliceThickness || ""}</p>
    <p><strong>Contrast Used:</strong> ${ct.contrastUsed || ""}</p>
    <p><strong>CT Notes:</strong> ${ct.ctNotes || ""}</p>`;
}
function renderDosimetry(dos) {
  if (!dos) return `<p>No Dosimetry/Physics data for this patient.</p>`;
  let html = `<h3>Dosimetry/Physics</h3>
    <p><strong>Plan ID:</strong> ${dos.planId || ""}</p>
    <p><strong>Rx:</strong> ${dos.rx || ""}</p>
    <p><strong>Technique:</strong> ${dos.technique || ""}</p>
    <p><strong>Energy:</strong> ${dos.energy || ""}</p>
    <p><strong>Number of Fields/Arcs:</strong> ${dos.numFields || ""}</p>
    <p><strong>Gantry Angles:</strong> ${dos.gantryAngles || ""}</p>
    <p><strong>Collimator Angles:</strong> ${dos.collAngles || ""}</p>
    <p><strong>Couch Angles:</strong> ${dos.couchAngles || ""}</p>
    <p><strong>Isocenter Coordinates:</strong> ${dos.isoCoords || ""}</p>
    <p><strong>Treatment Planning System (TPS):</strong> ${dos.tps || ""}</p>
    <p><strong>Dose Calculation Algorithm:</strong> ${dos.algorithm || ""}</p>
    <p><strong>Heterogeneity Correction:</strong> ${dos.hetero || ""}</p>
    <p><strong>Normalization Method:</strong> ${dos.norm || ""}</p>
    <p><strong>Constraints:</strong> ${dos.constraints || ""}</p>
    <p><strong>Dosimetry Notes:</strong> ${dos.planNotes || ""}</p>`;

  // Per-field breakdown
  if (dos.fieldsDetailed && dos.fieldsDetailed.length) {
    html += `<h4>Fields and Monitor Units (MUs)</h4>
      <table>
        <thead>
          <tr>
            <th>Field Name</th>
            <th>Gantry Angle</th>
            <th>Collimator Angle</th>
            <th>Couch Angle</th>
            <th>Energy</th>
            <th>Monitor Units (MU)</th>
            <th>SSD (cm)</th>
          </tr>
        </thead>
        <tbody>
          ${dos.fieldsDetailed.map(f =>
            `<tr>
                <td>${f.name || ""}</td>
                <td>${f.gantryAngle || ""}</td>
                <td>${f.collimatorAngle || ""}</td>
                <td>${f.couchAngle || ""}</td>
                <td>${f.energy || ""}</td>
                <td>${f.MU || ""}</td>
                <td>${f.ssd || ""}</td>
            </tr>`
          ).join("")}
        </tbody>
      </table>`;
  }
  return html;
}
// --- Practice Fraction Entry Form ---
function renderPracticeFractionEntryForm(patientData) {
  return `
    <div class="practice-section">
      <h3 style="margin-bottom: 1em;">Practice Daily Treatment Entry (Multiple Fractions)</h3>
      <form id="practiceFractionForm" autocomplete="off" onsubmit="return false;">
        <div class="practice-form-grid">

          <fieldset class="practice-fieldset" style="grid-column:1/2">
            <legend>Fraction Info</legend>
            <label for="practiceFractionNumCurrent">Fraction #</label>
            <input type="number" id="practiceFractionNumCurrent" min="1" required>
            <label for="practiceFractionNumTotal">Total Fractions</label>
            <input type="number" id="practiceFractionNumTotal" min="1" required>
            <label for="practiceTreatmentDate">Treatment Date</label>
            <input type="date" id="practiceTreatmentDate" required>
            <label for="practiceMachine">Machine</label>
            <select id="practiceMachine" required>
              <option value="">-- Select Machine --</option>
              <option value="LINAC 1">LINAC 1</option>
              <option value="LINAC 2">LINAC 2</option>
              <option value="LINAC 3">LINAC 3</option>
              <option value="LINAC 4">LINAC 4</option>
              <option value="Proton Gantry 1">Proton Gantry 1</option>
              <option value="Orthovoltage Unit">Orthovoltage Unit</option>
              <option value="Other">Other</option>
            </select>
          </fieldset>

          <fieldset class="practice-fieldset" style="grid-column:2/3">
            <legend>Treatment Delivery</legend>
            <label for="practiceFieldsAndMUs">Fields & MUs</label>
            <textarea id="practiceFieldsAndMUs" rows="2"></textarea>
            <label for="practiceEnergiesUsed">Energies Used</label>
            <input type="text" id="practiceEnergiesUsed">
            <label for="practiceSetupVerification">Setup Verification</label>
            <select id="practiceSetupVerification">
              <option value="Tolerances Met">Tolerances Met</option>
              <option value="Adjustments Made">Adjustments Made</option>
            </select>
            <label for="practiceImmobilizationDevicesChecked">Immobilization Devices</label>
            <input type="text" id="practiceImmobilizationDevicesChecked">
            <label for="practiceSetupAdjustments">Setup Adjustments</label>
            <textarea id="practiceSetupAdjustments" rows="2"></textarea>
            <label for="practiceOrganTargetChecks">Organ/Target Checks</label>
            <textarea id="practiceOrganTargetChecks" rows="2"></textarea>
          </fieldset>

          <fieldset class="practice-fieldset" style="grid-column:3/4">
            <legend>Image Guidance & Assessment</legend>
            <label for="practiceImagingType">Imaging Type</label>
            <select id="practiceImagingType">
              <option value="None">None</option>
              <option value="kV Pair">kV Pair (Orthogonal)</option>
              <option value="MV Portal">MV Portal Image</option>
              <option value="CBCT">Cone Beam CT (CBCT)</option>
              <option value="ExacTrac">ExacTrac</option>
              <option value="Surface Guidance">Surface Guidance (AlignRT)</option>
              <option value="Other">Other</option>
            </select>
            <label for="practiceIgrtMatchQuality">IGRT Match Quality</label>
            <select id="practiceIgrtMatchQuality">
              <option value="">-- Select --</option>
              <option value="Good - No Shifts">Good - No Shifts Required</option>
              <option value="Good - Shifts Applied">Good - Shifts Applied</option>
              <option value="Fair - Minor Deviations">Fair - Minor Deviations Noted</option>
              <option value="Poor - Action Taken">Poor - Action Taken</option>
            </select>
            <label for="practiceShiftsApplied">Shifts Applied</label>
            <input type="text" id="practiceShiftsApplied">
            <label for="practiceIgrtApprovedBy">IGRT Approved By</label>
            <input type="text" id="practiceIgrtApprovedBy">
            <label for="practiceIgrtVerificationNotes">IGRT Notes</label>
            <textarea id="practiceIgrtVerificationNotes" rows="2"></textarea>
            <label for="practicePatientTolerance">Patient Tolerance</label>
            <select id="practicePatientTolerance">
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
            <label for="practiceGeneralSideEffects">General Side Effects</label>
            <textarea id="practiceGeneralSideEffects" rows="2"></textarea>
            <label for="practiceSiteSpecificSideEffects">Site-Specific Side Effects</label>
            <textarea id="practiceSiteSpecificSideEffects" rows="2"></textarea>
            <label for="practicePainAssessment">Pain Assessment</label>
            <input type="text" id="practicePainAssessment">
            <label for="practicePatientConcerns">Patient Concerns</label>
            <textarea id="practicePatientConcerns" rows="2"></textarea>
            <label for="practiceInstructionsGiven">Instructions Given</label>
            <textarea id="practiceInstructionsGiven" rows="2"></textarea>
            <label for="practiceTherapistInitials">Therapist(s)</label>
            <input type="text" id="practiceTherapistInitials">
            <label for="practiceBillingCodes">Billing Codes</label>
            <input type="text" id="practiceBillingCodes">
            <label for="practiceDailyNotes">Daily Notes</label>
            <textarea id="practiceDailyNotes" rows="2"></textarea>
          </fieldset>

        </div>
        <button type="button" id="addPracticeFractionBtn">Add Practice Fraction Entry</button>
      </form>

      <hr>
      <h4>Practice Fractions Entered</h4>
      <table id="practiceFractionSessionTable" class="practice-table" border="1" style="width:100%;max-width:900px;">
        <thead><tr>
          <th>Fraction</th><th>Date</th><th>Machine</th><th>Fields/MU</th><th>Notes</th><th>Remove</th>
        </tr></thead>
        <tbody></tbody>
      </table>
      <button id="preparePracticeSummaryBtn" style="margin-top:18px;">Prepare Practice Submission Summary</button>
      <div id="practiceSubmissionOutput" style="display:none;margin-top:18px;">
        <h4>Practice Daily Record Summary:</h4>
        <textarea id="practiceSubmissionSummary" class="practice-summary-area" rows="20" readonly></textarea>
      </div>
    </div>
  `;
}

// --- Update renderTreatmentDelivery to append the practice form ---
function renderTreatmentDelivery(data) {
  const dos = data.dosimetry || {};
  const td = data.treatmentDelivery || {};
  let planSection = `<h3>Planned Treatment Summary (from Dosimetry)</h3>
    <p><strong>Plan ID:</strong> ${dos.planId || ""}</p>
    <p><strong>Rx:</strong> ${dos.rx || ""}</p>
    <p><strong>Technique:</strong> ${dos.technique || ""}</p>
    <p><strong>Energy:</strong> ${dos.energy || ""}</p>
    <p><strong>Fields:</strong> ${dos.fields || ""}</p>
    <p><strong>Number of Fields/Arcs:</strong> ${dos.numFields || ""}</p>
    <p><strong>Gantry Angles:</strong> ${dos.gantryAngles || ""}</p>
    <p><strong>Collimator Angles:</strong> ${dos.collAngles || ""}</p>
    <p><strong>Couch Angles:</strong> ${dos.couchAngles || ""}</p>
    <p><strong>Isocenter Coordinates:</strong> ${dos.isoCoords || ""}</p>
    <p><strong>Treatment Planning System (TPS):</strong> ${dos.tps || ""}</p>
    <p><strong>Dose Calculation Algorithm:</strong> ${dos.algorithm || ""}</p>
    <p><strong>Heterogeneity Correction:</strong> ${dos.hetero || ""}</p>
    <p><strong>Normalization Method:</strong> ${dos.norm || ""}</p>
    <p><strong>Constraints:</strong> ${dos.constraints || ""}</p>
    <p><strong>Dosimetry Notes:</strong> ${dos.planNotes || ""}</p>`;
  let fieldsSection = "";
  if (dos.fieldsDetailed && dos.fieldsDetailed.length) {
    fieldsSection = `<h4>Fields and Monitor Units (MUs)</h4>
      <table>
        <thead>
          <tr>
            <th>Field Name</th>
            <th>Gantry Angle</th>
            <th>Collimator Angle</th>
            <th>Couch Angle</th>
            <th>Energy</th>
            <th>Monitor Units (MU)</th>
          </tr>
        </thead>
        <tbody>
          ${dos.fieldsDetailed.map(f =>
            `<tr>
              <td>${f.name || ""}</td>
              <td>${f.gantryAngle || ""}</td>
              <td>${f.collimatorAngle || ""}</td>
              <td>${f.couchAngle || ""}</td>
              <td>${f.energy || ""}</td>
              <td>${f.MU || ""}</td>
            </tr>`
          ).join("")}
        </tbody>
      </table>`;
  }
 let fractionsSection = "";
  if (!td.fractions || !td.fractions.length) {
    fractionsSection = `<p>No Treatment Delivery records for this patient.</p>`;
  } else {
    fractionsSection = `<h3>Treatment Delivery Records</h3>
      <table>
        <thead>
          <tr>
            <th>Fraction</th>
            <th>Date</th>
            <th>Machine</th>
            <th>Side Effects</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${td.fractions.map(fx => `
            <tr>
              <td>${fx.fractionNumber}</td>
              <td>${fx.date}</td>
              <td>${fx.machine}</td>
              <td>${fx.sideEffects || ""}</td>
              <td>${fx.notes || ""}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>`;
  }
  // Inject practice entry form below the records table
  return planSection + fractionsSection + renderPracticeFractionEntryForm(data);
}

// --- Practice Fraction Form Logic ---
// We must re-attach handlers after every render of the Treatment Delivery subtab!
function initPracticeFractionFormHandlers() {
  const sessionFractions = [];
  function refreshFractionTable() {
    const tbody = document.getElementById('practiceFractionSessionTable')?.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    sessionFractions.forEach((entry, idx) => {
      const row = tbody.insertRow();
      row.insertCell(0).textContent = entry.fraction + " / " + entry.total;
      row.insertCell(1).textContent = entry.date;
      row.insertCell(2).textContent = entry.machine;
      row.insertCell(3).textContent = entry.fieldsAndMUs;
      row.insertCell(4).textContent = entry.notes;
      const removeCell = row.insertCell(5);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Remove';
      btn.onclick = () => {
        sessionFractions.splice(idx, 1);
        refreshFractionTable();
      };
      removeCell.appendChild(btn);
    });
  }
  const addBtn = document.getElementById('addPracticeFractionBtn');
  if (addBtn) {
    addBtn.onclick = function() {
      const form = document.getElementById('practiceFractionForm');
      const entry = {
        fraction: document.getElementById('practiceFractionNumCurrent').value,
        total: document.getElementById('practiceFractionNumTotal').value,
        date: document.getElementById('practiceTreatmentDate').value,
        machine: document.getElementById('practiceMachine').value,
        fieldsAndMUs: document.getElementById('practiceFieldsAndMUs')?.value || '',
        notes: document.getElementById('practiceDailyNotes')?.value || '',
        formSnapshot: Array.from(form.elements).reduce((acc, el) => {
          if (el.id) acc[el.id] = el.value;
          return acc;
        }, {})
      };
      sessionFractions.push(entry);
      refreshFractionTable();
      form.reset();
    };
  }
  const prepareBtn = document.getElementById('preparePracticeSummaryBtn');
  if (prepareBtn) {
    prepareBtn.onclick = function() {
      if (!sessionFractions.length) {
        alert("Please add at least one practice fraction entry before preparing the summary.");
        return;
      }
      let summary = "Practice Daily Radiation Treatment Record\n";
      summary += "=========================================\n\n";
      summary += "Patient: " + (document.getElementById('practicePatientName')?.value || '') + " (ID: " + (document.getElementById('practicePatientId')?.value || '') + ")\n\n";
      sessionFractions.forEach((fx, idx) => {
        summary += "-------------------------------\n";
        summary += `Fraction ${fx.fraction} / ${fx.total}\n`;
        summary += `Date: ${fx.date}\n`;
        summary += `Machine: ${fx.machine}\n`;
        summary += `Fields & MUs: ${fx.fieldsAndMUs}\n`;
        Object.entries(fx.formSnapshot).forEach(([k, v]) => {
          if (
            !["practiceFractionNumCurrent","practiceFractionNumTotal","practiceTreatmentDate","practiceMachine","practiceFieldsAndMUs","practiceDailyNotes","practicePatientName","practicePatientId"].includes(k)
            && v && v.trim()
          ) {
            summary += `${k.replace(/([A-Z])/g, " $1")}: ${v}\n`;
          }
        });
        summary += `General Notes: ${fx.notes}\n`;
        summary += "-------------------------------\n";
      });
      document.getElementById('practiceSubmissionSummary').value = summary;
      document.getElementById('practiceSubmissionOutput').style.display = 'block';
    };
  }
}

// --- Radiation Oncology Tabs ---
function renderRadOncSubTabs(activeKey, data) {
  return `<div id="radOnc-subtabs" style="display:flex;gap:0.5em;margin-bottom:1em;">
    ${radOncSubTabs.map(sub =>
      `<button class="emr-tab-btn${sub.key===activeKey?" active":""}" id="radOnc-subtab-btn-${sub.key}">${sub.label}</button>`
    ).join("")}
    </div>
    <div id="radOnc-subtab-contents"></div>`;
}
function showRadOncSubTab(subKey, data) {
  const subContents = document.getElementById('radOnc-subtab-contents');
  if (!subContents) return;
  switch (subKey) {
    case 'ctsim':
      subContents.innerHTML = renderCTSimulation(data.ctSimulation);
      break;
    case 'dosimetry':
      subContents.innerHTML = renderDosimetry(data.dosimetry);
      break;
    case 'treatmentDelivery':
      subContents.innerHTML = renderTreatmentDelivery(data);
      initPracticeFractionFormHandlers(); // <<<<< Attach practice form handlers here!
      break;
    default:
      subContents.innerHTML = "<p>No data.</p>";
      break;
  }
}

// --- Main Tab Switch Logic ---
function showTab(tabKey, data) {
  const tabContents = document.getElementById('emr-tab-contents');
  if (!tabContents) return;
  if (tabKey === "radOnc") {
    tabContents.innerHTML = renderRadOncSubTabs("ctsim", data);
    showRadOncSubTab("ctsim", data);
    radOncSubTabs.forEach(sub => {
      document.getElementById(`radOnc-subtab-btn-${sub.key}`).onclick = () => {
        radOncSubTabs.forEach(s2 => document.getElementById(`radOnc-subtab-btn-${s2.key}`).classList.remove("active"));
        document.getElementById(`radOnc-subtab-btn-${sub.key}`).classList.add("active");
        showRadOncSubTab(sub.key, data);
      };
    });
    return;
  }
  switch (tabKey) {
    case 'demographics': tabContents.innerHTML = renderDemographics(data); break;
    case 'diagnosis': tabContents.innerHTML = renderDiagnosis(data); break;
    case 'treatmentPlan': tabContents.innerHTML = renderTreatmentPlan(data); break;
    case 'imagingAndReports': tabContents.innerHTML = renderImagingAndReportsTab(data); break;
    case 'labResults': tabContents.innerHTML = renderLabResults(data); break;
    case 'progressNotes': tabContents.innerHTML = renderProgressNotes(data); break;
    case 'patientEducation': tabContents.innerHTML = renderPatientEducation(data); break;
    case 'scheduling': tabContents.innerHTML = renderScheduling(data); break;
    case 'cptCharges': tabContents.innerHTML = renderCptCharges(data); break;
    default: tabContents.innerHTML = "<p>No data.</p>"; break;
  }
}

// --- Patient Loader and Dropdown ---
let currentPatientData = null;
function loadAndDisplayPatient(fileName) {
  fetch(fileName)
    .then(resp => resp.json())
    .then(data => {
      currentPatientData = data;
      const tabsDiv = document.getElementById('emr-tabs');
      tabsDiv.innerHTML = emrTabs.map(
        (tab, i) => `<button class="emr-tab-btn${i===0?" active":""}" id="emr-tab-btn-${tab.key}">${tab.label}</button>`
      ).join("");
      emrTabs.forEach((tab, i) => {
        document.getElementById(`emr-tab-btn-${tab.key}`).onclick = () => {
          emrTabs.forEach(t2 => document.getElementById(`emr-tab-btn-${t2.key}`).classList.remove("active"));
          document.getElementById(`emr-tab-btn-${tab.key}`).classList.add("active");
          showTab(tab.key, data);
        };
      });
      showTab(emrTabs[0].key, data);
    });
}
function populatePatientDropdown(filteredPatients = patients) {
  const select = document.getElementById('patientSelect');
  select.innerHTML = "";
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
    if (patients.length > 0) loadAndDisplayPatient(patients[0].file);
    return;
  }
  const filtered = patients.filter(p =>
    p.diagnosis && p.diagnosis.toLowerCase().includes(searchValue)
  );
  populatePatientDropdown(filtered);
  if (filtered.length > 0) loadAndDisplayPatient(filtered[0].file);
  else document.getElementById('emr-tab-contents').innerHTML = "<p>No matching patients found.</p>";
}

// --- On Page Load ---
document.addEventListener('DOMContentLoaded', () => {
  populatePatientDropdown();
  if (patients && patients.length > 0) loadAndDisplayPatient(patients[0].file);
  document.getElementById('patientSelect').addEventListener('change', function() {
    loadAndDisplayPatient(this.value);
  });
  document.getElementById('diagnosisSearch').addEventListener('input', filterPatientsByDiagnosis);
});
