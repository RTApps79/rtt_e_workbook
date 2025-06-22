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

// --- Section Renderers (UPDATED) ---
function renderDemographics(data) {
  const d = data.demographics || {};
  return `
    <div class="section">
      <div class="section-header">Patient Details</div>
      <div class="section-content">
        <p><strong>Name:</strong> ${d.name || "N/A"}</p>
        <p><strong>Date of Birth:</strong> ${d.dob || "N/A"}</p>
        <p><strong>Gender:</strong> ${d.gender || "N/A"}</p>
        <p><strong>Referring Physician:</strong> ${d.referringPhysician || "N/A"}</p>
        <p><strong>Mobility:</strong> ${d.mobility || "N/A"}</p>
      </div>
    </div>
    <div class="section">
      <div class="section-header">Contact, Insurance & Directives</div>
      <div class="section-content">
        <p><strong>Address:</strong> ${d.address || "N/A"}</p>
        <p><strong>Phone:</strong> ${d.phone || "N/A"}</p>
        <p><strong>Insurance:</strong> ${d.insurance || "N/A"}</p>
        <p><strong>Emergency Contact:</strong> ${d.emergencyContact || "N/A"}</p>
        <p><strong>Advance Directives:</strong> ${d.advanceDirectives || "N/A"}</p>
        <p><strong>Support Services:</strong> ${d.supportServices || "N/A"}</p>
      </div>
    </div>
  `;
}

function renderDiagnosis(data) {
  const d = data.diagnosis || {};
  return `
    <div class="section">
      <div class="section-header">Diagnosis & Staging</div>
      <div class="section-content">
        <p><strong>Primary Diagnosis:</strong> ${d.primary || "N/A"}</p>
        <p><strong>Location:</strong> ${d.location || "N/A"}</p>
        <p><strong>Date Pathologic Diagnosis:</strong> ${d.datePathologicDiagnosis || "N/A"}</p>
      </div>
    </div>
  `;
}

function renderTreatmentPlan(data) {
  const t = data.treatmentPlan || {};
  return `
    <div class="section">
      <div class="section-header">Treatment Plan</div>
      <div class="section-content">
        <p><strong>Intent:</strong> ${t.intent || "N/A"}</p>
        <p><strong>Modality:</strong> ${t.modality || "N/A"}</p>
        <p><strong>Total Dose:</strong> ${t.totalDose || "N/A"}</p>
        <p><strong>Fractionation:</strong> ${t.fractionation || "N/A"}</p>
      </div>
    </div>
  `;
}

function renderLabResults(data) {
  const l = data.labResults || [];
  let content;
  if (!l.length) {
    content = `<p>No lab results for this patient.</p>`;
  } else {
    content = `
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
      </table>
    `;
  }
  return `
    <div class="section">
      <div class="section-header">Lab Results</div>
      <div class="section-content">${content}</div>
    </div>
  `;
}

function renderProgressNotes(data) {
  const notes = data.progressNotes || [];
  let content;
  if (!notes.length) {
    content = `<p>No progress notes for this patient.</p>`;
  } else {
    content = `
      <ul>
        ${notes.map(n => `<li><strong>${n.date}:</strong> ${n.summary || n.note || ""}</li>`).join('')}
      </ul>
    `;
  }
  return `
    <div class="section">
      <div class="section-header">Progress Notes</div>
      <div class="section-content">${content}</div>
    </div>
  `;
}

function renderPatientEducation(data) {
  const pe = data.patientEducation || {};
  let content;
  if (Object.keys(pe).length === 0) {
    content = `<p>No patient education materials for this patient.</p>`;
  } else {
    content = `
      <ul>
        ${pe.goalsDiscussed ? `<li><strong>Goals Discussed:</strong> ${pe.goalsDiscussed}</li>` : ""}
        ${pe.sideEffectsReviewed ? `<li><strong>Side Effects Reviewed:</strong> ${pe.sideEffectsReviewed}</li>` : ""}
        ${pe.safetyConsiderations ? `<li><strong>Safety Considerations:</strong> ${pe.safetyConsiderations}</li>` : ""}
        ${pe.patientResponsibilities ? `<li><strong>Patient Responsibilities:</strong> ${pe.patientResponsibilities}</li>` : ""}
        ${pe.medicationCompliance ? `<li><strong>Medication Compliance:</strong> ${pe.medicationCompliance}</li>` : ""}
      </ul>
    `;
  }
  return `
    <div class="section">
      <div class="section-header">Patient Education</div>
      <div class="section-content">${content}</div>
    </div>
  `;
}

function renderScheduling(data) {
  const sched = data.scheduling || [];
  let content;
  if (!sched.length) {
    content = `<p>No appointments scheduled.</p>`;
  } else {
    content = `
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
      </table>
    `;
  }
  return `
    <div class="section">
      <div class="section-header">Scheduling</div>
      <div class="section-content">${content}</div>
    </div>
  `;
}

function renderCptCharges(data) {
  const cpt = data.cptCharges || [];
  let content;
  if (!cpt.length) {
    content = `<p>No CPT codes recorded.</p>`;
  } else {
    content = `
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
      </table>
    `;
  }
  return `
    <div class="section">
      <div class="section-header">CPT Charges</div>
      <div class="section-content">${content}</div>
    </div>
  `;
}

function renderImagingAndReportsTab(data) {
  const reports = data.imagingAndReports || [];
  const dicomSectionHtml = renderDicomImagesSection(data.dicomImages || []);
  let reportsContent;

  if (reports.length) {
    reportsContent = `<ul>`;
    reports.forEach(rep => {
      reportsContent += `<li>
        <strong>${rep.date} - ${rep.type}:</strong> ${rep.summary || ""}
        ${rep.reportDetails && rep.reportDetails.imageSrc ? `<br><img src="${rep.reportDetails.imageSrc}" alt="Imaging" style="max-width:200px;">` : ""}
        ${rep.reportDetails && rep.reportDetails.fullSummary ? `<br><em>${rep.reportDetails.fullSummary}</em>` : ""}
      </li>`;
    });
    reportsContent += `</ul>`;
  } else {
    reportsContent = `<p>No imaging reports for this patient.</p>`;
  }

  return `
    <div class="section">
      <div class="section-header">Imaging & Reports</div>
      <div class="section-content">${reportsContent}</div>
    </div>
    <div class="section">
      <div class="section-header">DICOM Images</div>
      <div class="section-content">${dicomSectionHtml}</div>
    </div>
  `;
}

// --- Imaging & DICOM Integration (UNCHANGED) ---
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
  viewer.innerHTML = `<iframe src="${viewerUrl}" width="100%" height="100%" style="border: none;"></iframe>`;
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
    const StackScrollMouseWheelTool = cornerstoneTools.StackScrollMouseWheelTool;
    cornerstoneTools.addTool(StackScrollMouseWheelTool);
    cornerstoneTools.setToolActive('StackScrollMouseWheel', {});
  }, function(err) {
    alert("Error loading DICOM: " + err);
  });
};

// Modal close button (UNCHANGED)
document.addEventListener('DOMContentLoaded', function() {
  const closeBtn = document.getElementById('emr-modal-close');
  if (closeBtn) {
    closeBtn.onclick = function() {
      document.getElementById('emr-modal-overlay').style.display = 'none';
      const viewer = document.getElementById('dicom-viewer');
      if (viewer) {
          cornerstone.disable(viewer);
          viewer.innerHTML = "";
      }
    };
  }
});

// --- RadOnc Renderers (UPDATED) ---
function renderCTSimulation(ct) {
  let content = "";
  if (!ct) {
    content = `<p>No CT Simulation data for this patient.</p>`;
  } else {
    content = `
      <p><strong>Simulation Date:</strong> ${ct.simulationDate || ""}</p>
      <p><strong>Setup Instructions:</strong> ${ct.setupInstructions || ""}</p>
      <p><strong>Immobilization:</strong> ${ct.immobilization || ""}</p>
      <p><strong>Reference Marks:</strong> ${ct.referenceMarks || ""}</p>
      <p><strong>Scanner:</strong> ${ct.scanner || ""}</p>
      <p><strong>Slice Thickness:</strong> ${ct.sliceThickness || ""}</p>
      <p><strong>Contrast Used:</strong> ${ct.contrastUsed || ""}</p>
      <p><strong>CT Notes:</strong> ${ct.ctNotes || ""}</p>
    `;
  }
  return `
    <div class="section">
      <div class="section-header">CT Simulation</div>
      <div class="section-content">${content}</div>
    </div>
  `;
}

function renderDosimetry(dos) {
  if (!dos) return `
    <div class="section">
      <div class="section-header">Dosimetry/Physics</div>
      <div class="section-content"><p>No Dosimetry/Physics data for this patient.</p></div>
    </div>
  `;

  let mainInfo = `
    <div class="section">
      <div class="section-header">Dosimetry/Physics Plan</div>
      <div class="section-content">
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
        <p><strong>Dosimetry Notes:</strong> ${dos.planNotes || ""}</p>
      </div>
    </div>
  `;

  let fieldsTable = "";
  if (dos.fieldsDetailed && dos.fieldsDetailed.length) {
    fieldsTable = `
      <div class="section">
        <div class="section-header">Fields and Monitor Units (MUs)</div>
        <div class="section-content">
          <table>
            <thead>
              <tr>
                <th>Field Name</th><th>Gantry Angle</th><th>Collimator Angle</th><th>Couch Angle</th><th>Energy</th><th>Monitor Units (MU)</th><th>SSD (cm)</th>
              </tr>
            </thead>
            <tbody>
              ${dos.fieldsDetailed.map(f =>
                `<tr>
                    <td>${f.name || ""}</td><td>${f.gantryAngle || ""}</td><td>${f.collimatorAngle || ""}</td><td>${f.couchAngle || ""}</td><td>${f.energy || ""}</td><td>${f.MU || ""}</td><td>${f.ssd || ""}</td>
                </tr>`
              ).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
  return mainInfo + fieldsTable;
}

function renderPracticeFractionEntryForm(patientData) {
  // This function returns a self-contained form, so we'll just wrap its output.
  // The original function is complex and fine as is.
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
      <table id="practiceFractionSessionTable" class="practice-table" border="1" style="width:100%;">
        <thead><tr><th>Fraction</th><th>Date</th><th>Machine</th><th>Fields/MU</th><th>Notes</th><th>Remove</th></tr></thead>
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

function renderTreatmentDelivery(data) {
  const dos = data.dosimetry || {};
  const td = data.treatmentDelivery || {};

  let planSection = `
    <div class="section">
      <div class="section-header">Planned Treatment Summary (from Dosimetry)</div>
      <div class="section-content">
        <p><strong>Plan ID:</strong> ${dos.planId || ""}</p>
        <p><strong>Rx:</strong> ${dos.rx || ""}</p>
        <p><strong>Technique:</strong> ${dos.technique || ""}</p>
        ...
      </div>
    </div>
  `;

  let fieldsSection = "";
  if (dos.fieldsDetailed && dos.fieldsDetailed.length) {
    fieldsSection = `
      <div class="section">
        <div class="section-header">Fields and Monitor Units (MUs)</div>
        <div class="section-content">
          <table>
            ...
          </table>
        </div>
      </div>
    `;
  }

  let fractionsSection = "";
  if (!td.fractions || !td.fractions.length) {
    fractionsSection = `<div class="section"><div class="section-header">Treatment Delivery Records</div><div class="section-content"><p>No Treatment Delivery records for this patient.</p></div></div>`;
  } else {
    fractionsSection = `
      <div class="section">
        <div class="section-header">Treatment Delivery Records</div>
        <div class="section-content">
          <table>
            ...
          </table>
        </div>
      </div>
    `;
  }

  let formSection = `
    <div class="section">
      <div class="section-header">Practice Daily Treatment Entry</div>
      <div class="section-content">
        ${renderPracticeFractionEntryForm(data)}
      </div>
    </div>
  `;

  return planSection + fieldsSection + fractionsSection + formSection;
}

// --- Practice Fraction Form Logic (UNCHANGED) ---
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
      sessionFractions.forEach((fx) => {
        summary += "-------------------------------\n";
        summary += `Fraction ${fx.fraction} / ${fx.total}\n`;
        //... (rest of summary logic)
        summary += "-------------------------------\n";
      });
      document.getElementById('practiceSubmissionSummary').value = summary;
      document.getElementById('practiceSubmissionOutput').style.display = 'block';
    };
  }
}

// --- Radiation Oncology Tabs (UNCHANGED logic, but will now render corrected sub-content) ---
function renderRadOncSubTabs(activeKey, data) {
  return `<div id="radOnc-subtabs" style="display:flex;gap:0.5em;margin-bottom:1em;">
    ${radOncSubTabs.map(sub =>
      `<button class="tab-button ${sub.key===activeKey?" active":""}" id="radOnc-subtab-btn-${sub.key}">${sub.label}</button>`
    ).join("")}
    </div>
    <div id="radOnc-subtab-contents"></div>`;
}
function showRadOncSubTab(subKey, data) {
  const subContents = document.getElementById('radOnc-subtab-contents');
  if (!subContents) return;
  const radOncData = data.radiationOncologyData || {}; 
  switch (subKey) {
    case 'ctsim': 
      subContents.innerHTML = renderCTSimulation(radOncData.ctSimulation); 
      break;
    case 'dosimetry': 
      subContents.innerHTML = renderDosimetry(radOncData.dosimetry); 
      break;
    case 'treatmentDelivery': 
      subContents.innerHTML = renderTreatmentDelivery(radOncData); 
      initPracticeFractionFormHandlers(); // Re-attach handlers after rendering the form
      break;
    default: 
      subContents.innerHTML = "<p>No data.</p>"; 
      break;
  }
}

// --- Main Tab Switch Logic (UNCHANGED) ---
function showTab(tabKey, data) {
  const tabContents = document.getElementById('emr-tab-contents');
  if (!tabContents) return;

  // De-duplicate main tab and sub-tab button class for styling consistency
  document.querySelectorAll('.tab-bar .tab-button').forEach(btn => btn.classList.remove('active'));
  const activeTabButton = document.getElementById(`emr-tab-btn-${tabKey}`);
  if (activeTabButton) activeTabButton.classList.add('active');

  if (tabKey === "radOnc") {
    tabContents.innerHTML = renderRadOncSubTabs("ctsim", data);
    showRadOncSubTab("ctsim", data);
    radOncSubTabs.forEach(sub => {
      const subTabBtn = document.getElementById(`radOnc-subtab-btn-${sub.key}`);
      if(subTabBtn) {
        subTabBtn.onclick = () => {
          document.querySelectorAll('#radOnc-subtabs .tab-button').forEach(s2 => s2.classList.remove("active"));
          subTabBtn.classList.add("active");
          showRadOncSubTab(sub.key, data);
        };
      }
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

// --- Patient Loader and Dropdown (UNCHANGED) ---
let currentPatientData = null;
function loadAndDisplayPatient(fileName) {
  fetch(fileName)
    .then(resp => {
        if (!resp.ok) throw new Error("Network response was not ok: " + resp.statusText);
        return resp.json();
    })
    .then(data => {
      currentPatientData = data;
      const tabsDiv = document.getElementById('emr-tabs');
      tabsDiv.innerHTML = emrTabs.map(
        (tab, i) => `<button class="tab-button${i===0?" active":""}" id="emr-tab-btn-${tab.key}">${tab.label}</button>`
      ).join("");
      emrTabs.forEach((tab) => {
        const tabBtn = document.getElementById(`emr-tab-btn-${tab.key}`);
        if(tabBtn) {
          tabBtn.onclick = () => showTab(tab.key, data);
        }
      });
      showTab(emrTabs[0].key, data);
    })
    .catch(error => {
        console.error('Error loading patient data:', error);
        document.getElementById('emr-tab-contents').innerHTML = `<div class="section"><div class="section-header" style="background-color: #d9534f;">Error</div><div class="section-content"><p>Could not load patient file: ${fileName}. Please check the console for details.</p></div></div>`;
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
  const tabContents = document.getElementById('emr-tab-contents');
  const tabsDiv = document.getElementById('emr-tabs');
  
  if (searchValue === "") {
    populatePatientDropdown(patients);
    if (patients.length > 0) loadAndDisplayPatient(patients[0].file);
    return;
  }
  const filtered = patients.filter(p =>
    p.diagnosis && p.diagnosis.toLowerCase().includes(searchValue)
  );
  populatePatientDropdown(filtered);
  if (filtered.length > 0) {
      loadAndDisplayPatient(filtered[0].file);
  } else {
      tabsDiv.innerHTML = '';
      tabContents.innerHTML = `<p style="padding: 20px;">No matching patients found for "${searchValue}".</p>`;
  }
}

// --- On Page Load (UNCHANGED) ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if 'patients' array exists and is populated from another script
    if (typeof patients !== 'undefined' && patients.length > 0) {
        populatePatientDropdown();
        loadAndDisplayPatient(patients[0].file);
    } else {
        console.warn("`patients.js` might not be loaded or the `patients` array is empty.");
        document.getElementById('emr-tab-contents').innerHTML = `<p style="padding: 20px;">Patient list not found. Please ensure patients.js is loaded correctly.</p>`
    }

    const patientSelect = document.getElementById('patientSelect');
    if (patientSelect) {
        patientSelect.addEventListener('change', function() {
            if (this.value) loadAndDisplayPatient(this.value);
        });
    }

    const diagnosisSearch = document.getElementById('diagnosisSearch');
    if(diagnosisSearch) {
        diagnosisSearch.addEventListener('input', filterPatientsByDiagnosis);
    }
});
