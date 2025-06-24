// --- EMR Tabs and Sub-Tabs Global Constants ---
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

// ============================================================================================
// --- ALL CONTENT RENDERING FUNCTIONS (MUST BE DEFINED FIRST) ---
// These functions generate the HTML content for each section/tab.
// ============================================================================================

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
  let pathFindingsHtml = '';
  if (d.pathologyFindings && d.pathologyFindings.length > 0) {
    pathFindingsHtml = `
      <p><strong>Pathology Findings:</strong></p>
      <ul>
        ${d.pathologyFindings.map(item => `<li>${item}</li>`).join('')}
      </ul>
    `;
  }
  return `
    <div class="section">
      <div class="section-header">Diagnosis & Staging</div>
      <div class="section-content">
        <p><strong>Primary Diagnosis:</strong> ${d.primary || "N/A"}</p>
        <p><strong>Location:</strong> ${d.location || "N/A"}</p>
        <p><strong>Grade:</strong> ${d.grade || "N/A"}</p>
        <p><strong>Tumor Size:</strong> ${d.tumorSize || "N/A"}</p>
        <p><strong>Vascular Involvement:</strong> ${d.vascularInvolvement || "N/A"}</p>
        <p><strong>Pathologic Stage:</strong> ${d.pathologicStage || "N/A"}</p>
        <p><strong>Date Pathologic Diagnosis:</strong> ${d.datePathologicDiagnosis || "N/A"}</p>
        <p><strong>Symptoms at Presentation:</strong> ${d.symptomsAtPresentation || "N/A"}</p>
        ${pathFindingsHtml}
        <p><strong>Prior Procedures:</strong> ${d.priorProcedures || "N/A"}</p>
        <p><strong>Baseline Status:</strong> ${d.baselineStatus || "N/A"}</p>
        <p><strong>Prior Treatment Summary:</strong> ${d.priorTreatmentSummary || "N/A"}</p>
      </div>
    </div>
  `;
}

function renderTreatmentPlan(data) {
  const t = data.treatmentPlan || {};
  let medicationsHtml = '';
  if (t.medications && t.medications.length > 0) {
    medicationsHtml = `
      <p><strong>Medications:</strong></p>
      <ul>
        ${t.medications.map(med => `<li>${med}</li>`).join('')}
      </ul>
    `;
  }

  let therapistAlertsHtml = '';
  if (t.therapistAlerts && t.therapistAlerts.length > 0) {
    therapistAlertsHtml = `
      <p><strong>Therapist Alerts:</strong></p>
      <ul>
        ${t.therapistAlerts.map(alert => `<li>${alert}</li>`).join('')}
      </ul>
    `;
  }

  const physiciansHtml = `
    ${t.radOnc ? `<p><strong>Radiation Oncologist:</strong> ${t.radOnc}</p>` : ''}
    ${t.medOnc ? `<p><strong>Medical Oncologist:</strong> ${t.medOnc}</p>` : ''}
    ${t.surgOnc ? `<p><strong>Surgical Oncologist:</strong> ${t.surgOnc}</p>` : ''}
    ${t.gynOnc ? `<p><strong>Gynecologic Oncologist:</strong> ${t.gynOnc}</p>` : ''}
    ${t.dermatologist ? `<p><strong>Dermatologist:</strong> ${t.dermatologist}</p>` : ''}
  `;
  return `
    <div class="section">
      <div class="section-header">Treatment Plan</div>
      <div class="section-content">
        ${physiciansHtml}
        <p><strong>Treatment Site:</strong> ${t.treatmentSite || "N/A"}</p>
        <p><strong>Intent:</strong> ${t.intent || "N/A"}</p>
        <p><strong>Modality:</strong> ${t.modality || "N/A"}</p>
        <p><strong>Prescription:</strong> ${t.rtRxDetails || (t.totalDose && t.fractionation ? `${t.totalDose} / ${t.fractionation}` : "N/A")}</p>
        <p><strong>Target Volume Summary:</strong> ${t.targetVolumeSummary || "N/A"}</p>
        <p><strong>Technique Summary:</strong> ${t.techniqueSummary || "N/A"}</p>
        <p><strong>Concurrent Chemotherapy:</strong> ${t.concurrentChemo || "None"}</p>
        <p><strong>Detailed Concurrent Chemotherapy:</strong> ${t.detailedConcurrentChemo || "N/A"}</p>
        ${medicationsHtml}
        ${therapistAlertsHtml}
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
      <table border="1" class="data-table">
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
        content = `<ul>`;
        notes.forEach(note => {
            content += `<li>
                <strong>${note.date} (${note.type || 'Note'} by ${note.author || 'Unknown'}):</strong>
                ${note.summary || ''}
            </li>`;
        });
        content += `</ul>`;
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
      <table border="1" class="data-table">
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
      <table border="1" class="data-table">
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
    reports.forEach((rep, index) => {
      const viewButton = rep.reportDetails
        ? `<button onclick="window.showReportModal('${rep.type}', ${index})">View Full Report</button>`
        : '';
      reportsContent += `<li>
        <strong>${rep.date} - ${rep.type}:</strong> ${rep.summary || ""} ${viewButton}
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

function renderDicomImagesSection(dicomImages = []) {
  if (!dicomImages.length) return '<p>No DICOM images for this patient.</p>';
  return dicomImages.map((img, i) => {
    let buttons = '';
    if (img.imageUrls && img.imageUrls.length) {
      buttons += `<button onclick="window.loadDicomSeries(${i})">View in App</button> `;
    }
    if (img.ohifViewerUrl) {
      buttons += `<a href="${img.ohifViewerUrl}" target="_blank" rel="noopener" class="button-link">View in OHIF Viewer</a> `;
      buttons += `<button onclick="window.embedOhifViewer('${img.ohifViewerUrl}', '${img.description}')">Embed in Chart</button>`;
    }
    if (!buttons) {
      buttons = '<em>No images available for this series.</em>';
    }
    
    return `
      <div style="margin-bottom:1em;">
        <strong>${img.description || 'DICOM Series'}</strong> (${img.seriesType || 'Unknown'})<br>
        ${buttons}
      </div>
    `;
  }).join('');
}

window.embedOhifViewer = function(viewerUrl, title) {
  const modal = document.getElementById('emr-modal-overlay');
  const modalTitleEl = modal.querySelector('.modal-header span');
  const modalContentEl = document.getElementById('dicom-viewer');
  if (modalTitleEl) modalTitleEl.textContent = title || "DICOM Viewer";
  modalContentEl.innerHTML = `<iframe src="${viewerUrl}" width="100%" height="100%" style="border: none;"></iframe>`;
  modal.style.display = 'flex';
};

window.loadDicomSeries = function(seriesIdx) {
  const series = currentPatientData.dicomImages[seriesIdx];
  if (!series || !series.imageUrls || !series.imageUrls.length) {
    alert("No images found for this series.");
    return;
  }
  const modal = document.getElementById('emr-modal-overlay');
  const modalTitleEl = modal.querySelector('.modal-header span');
  const modalContentEl = document.getElementById('dicom-viewer');
  if (modalTitleEl) modalTitleEl.textContent = series.description || "DICOM Series";
  modalContentEl.innerHTML = ''; 
  modalContentEl.style.backgroundColor = '#000'; 
  modal.style.display = 'flex';
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

function renderCTSimulation(ct) {
  ct = ct || {};
  const apImage = ct.setupImages?.find(img => img.type === 'AP');
  const latImage = ct.setupImages?.find(img => img.type === 'Lateral');

  const officialPhotosHtml = `
    <div class="section">
      <div class="section-header">Official Setup Photos</div>
      <div class="section-content" style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start;">
        <div class="setup-photo-container">
          <strong>AP View</strong>
          <img id="apImagePreview" src="${apImage?.url || 'https://placehold.co/250x200?text=AP+Photo'}" alt="AP Setup Photo">
          <label for="apImageUploader" class="button-like-label">Upload AP Image</label>
          <input type="file" id="apImageUploader" accept="image/*" style="display: none;">
        </div>
        <div class="setup-photo-container">
          <strong>Lateral View</strong>
          <img id="latImagePreview" src="${latImage?.url || 'https://placehold.co/250x200?text=Lateral+Photo'}" alt="Lateral Setup Photo">
          <label for="latImageUploader" class="button-like-label">Upload Lateral Image</label>
          <input type="file" id="latImageUploader" accept="image/*" style="display: none;">
        </div>
      </div>
    </div>
  `;

  const detailsContent = `
    <p><strong>Simulation Date:</strong> ${ct.simulationDate || ""}</p>
    <p><strong>Setup Instructions:</strong> ${ct.setupInstructions || ""}</p>
    <p><strong>Immobilization:</strong> ${ct.immobilization || ""}</p>
    <p><strong>Reference Marks:</strong> ${ct.referenceMarks || ""}</p>
    <p><strong>Scanner:</strong> ${ct.scanner || ""}</p>
    <p><strong>Slice Thickness:</strong> ${ct.sliceThickness || ""}</p>
    <p><strong>Contrast Used:</strong> ${ct.contrastUsed || ""}</p>
    <p><strong>CT Notes:</strong> ${ct.ctNotes || ""}</p>
  `;
  const detailsSection = `
    <div class="section">
      <div class="section-header">
        <span>CT Simulation Details</span>
        <button id="printCtsimBtn" style="float: right; margin-top: -5px;">Print Summary</button>
      </div>
      <div class="section-content">${detailsContent}</div>
    </div>
  `;
  return officialPhotosHtml + detailsSection;
}

// ==================================================================
// === DOSIMETRY RENDERER (UPDATED with Verification Fields Table) ===
// ==================================================================
function renderDosimetry(dos) {
  if (!dos) return `
    <div class="section">
      <div class="section-header">Dosimetry/Physics</div>
      <div class="section-content"><p>No Dosimetry/Physics data for this patient.</p></div>
    </div>
  `;
  // Condensed Dosimetry Plan Info into columns
  let mainInfo = `
    <div class="section">
      <div class="section-header">Dosimetry/Physics Plan</div>
      <div class="section-content dosimetry-grid">
        <p><strong>Plan ID:</strong> ${dos.planId || ""}</p>
        <p><strong>Plan Status:</strong> ${dos.planStatus || "N/A"}</p>
        <p><strong>Rx:</strong> ${dos.rx || ""}</p>
        <p><strong>Technique:</strong> ${dos.technique || ""}</p>
        <p><strong>Energy:</strong> ${dos.energy || ""}</p>
        <p><strong>Number of Fields/Arcs:</strong> ${dos.numberOfFieldsOrArcs || "N/A"}</p>
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

  // IGRT Protocol Section
  let igrtProtocolHtml = '';
  if (dos.igrtProtocol) {
    igrtProtocolHtml = `
      <div class="section">
        <div class="section-header">IGRT Protocol</div>
        <div class="section-content">
          <p><strong>Frequency:</strong> ${dos.igrtProtocol.frequency || "N/A"}</p>
          <p><strong>Type:</strong> ${dos.igrtProtocol.type || "N/A"}</p>
          <p><strong>Alignment:</strong> ${dos.igrtProtocol.alignment || "N/A"}</p>
        </div>
      </div>
    `;
  }

  // QA Checks Section
  let qaChecksHtml = '';
  if (dos.qaChecks && dos.qaChecks.length > 0) {
    qaChecksHtml = `
      <div class="section">
        <div class="section-header">QA Checks</div>
        <div class="section-content">
          <ul>
            ${dos.qaChecks.map(check => `<li><strong>Date:</strong> ${check.date || "N/A"}, <strong>Type:</strong> ${check.type || "N/A"}, <strong>By:</strong> ${check.by || "N/A"} ${check.result ? `, <strong>Result:</strong> ${check.result}` : ""}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;
  }


  let fieldsTable = "";
  if (dos.fieldDetails && dos.fieldDetails.length > 0) {
    fieldsTable = `
      <div class="section">
        <div class="section-header">Treatment Fields and Monitor Units (MUs)</div>
        <div class="section-content">
          <table border="1" class="data-table">
            <thead>
              <tr>
                <th>Field Name</th><th>Field Size</th><th>Gantry Angle</th><th>Coll. Angle</th><th>Couch Angle</th><th>Energy</th><th>MU</th><th>SSD (cm)</th>
              </tr>
            </thead>
            <tbody>
              ${dos.fieldDetails.map(f =>
                `<tr>
                    <td>${f.fieldName || ""}</td><td>${f.fieldSize || "N/A"}</td><td>${f.gantryAngle || ""}</td><td>${f.collimatorAngle || ""}</td><td>${f.couchAngle || ""}</td><td>${f.energy || ""}</td><td>${f.monitorUnits || ""}</td><td>${f.ssd || "N/A"}</td>
                </tr>`
              ).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
  
  // New table for Verification Imaging Fields
  let imagingFieldsTable = "";
  if (dos.imagingFields && dos.imagingFields.length > 0) {
    imagingFieldsTable = `
      <div class="section">
        <div class="section-header">Verification Imaging Fields</div>
        <div class="section-content">
          <table border="1" class="data-table">
            <thead>
              <tr>
                <th>Field Name</th><th>Gantry Angle</th><th>Field Size</th><th>Energy</th><th>MU</th>
            </tr>
            </thead>
            <tbody>
              ${dos.imagingFields.map(f =>
                `<tr>
                    <td>${f.fieldName || ""}</td>
                    <td>${f.gantryAngle || ""}</td>
                    <td>${f.fieldSize || "N/A"}</td>
                    <td>${f.energy || ""}</td>
                    <td>${f.monitorUnits || ""}</td>
                </tr>`
            ).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  return mainInfo + igrtProtocolHtml + qaChecksHtml + fieldsTable + imagingFieldsTable;
}

// Function to initialize the toggle functionality for fraction details
function initFractionDetailToggles() {
    document.querySelectorAll('.toggle-details-btn').forEach(button => {
        button.removeEventListener('click', handleToggleDetails); // Prevent multiple event listeners
        button.addEventListener('click', handleToggleDetails);
    });
}

function handleToggleDetails(event) {
    const fractionId = event.target.dataset.fractionId;
    const detailsDiv = document.getElementById(fractionId);
    if (detailsDiv) {
        detailsDiv.classList.toggle('fraction-details-hidden');
        event.target.textContent = detailsDiv.classList.contains('fraction-details-hidden') ? 'Show All Details' : 'Hide Details';
    }
}


// Function to render the practice daily treatment entry form
function renderPracticeFractionEntryForm(patientData) {
    const dosimetry = patientData?.radiationOncologyData?.dosimetry || {};
    const treatmentPlan = patientData?.treatmentPlan || {};

    // Extract total fractions safely
    let totalFractionsFromRx = '';
    if (dosimetry.rx) {
        const match = dosimetry.rx.match(/\/ (\d+) fx/); // Safely extract the number before 'fx'
        if (match && match[1]) {
            totalFractionsFromRx = match[1];
        }
    }

    let fieldEntryHtml = '<p>No fields defined in dosimetry plan to record daily MUs.</p>';
    if (dosimetry.fieldDetails && dosimetry.fieldDetails.length > 0) {
        fieldEntryHtml = `
            <table id="dailyFieldEntryTable" class="practice-table data-table" border="1">
                <thead>
                    <tr><th>Field Name</th><th>Planned MU</th><th>Delivered MU</th><th>Field Notes</th></tr>
                </thead>
                <tbody>
                    ${dosimetry.fieldDetails.map(field => `
                        <tr>
                            <td>${field.fieldName}</td>
                            <td>${field.monitorUnits}</td>
                            <td><input type="number" class="daily-mu-input" data-field-name="${field.fieldName}" placeholder="MU"></td>
                            <td><input type="text" class="daily-field-notes" data-field-name="${field.fieldName}" placeholder="Notes"></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    return `
    <div class="practice-section">
      <h3 style="margin-bottom: 1em;">Practice Daily Treatment Entry</h3>
      <form id="practiceFractionForm" autocomplete="off" onsubmit="return false;">
        <div class="form-columns">
            <fieldset class="practice-fieldset">
                <legend>Patient & Treatment Info</legend>
                <p><strong>Patient Name:</strong> ${patientData?.demographics?.name || 'N/A'}</p>
                <p><strong>MRN:</strong> ${patientData?.patientId || 'N/A'}</p>
                <p><strong>Anatomic Site:</strong> ${treatmentPlan.treatmentSite || 'N/A'}</p>
                <p><strong>Diagnosis:</strong> ${patientData?.diagnosis?.primary || 'N/A'}</p>
                <p><strong>Prescription:</strong> ${treatmentPlan.rtRxDetails || 'N/A'}</p>
                <p><strong>Technique:</strong> ${treatmentPlan.techniqueSummary || 'N/A'}</p>
                <p><strong>Modality:</strong> ${treatmentPlan.modality || 'N/A'}</p>
                <p><strong>Energy:</strong> ${dosimetry.energy || 'N/A'}</p>

                <label for="practiceFractionNumCurrent">Fraction #</label>
                <input type="number" id="practiceFractionNumCurrent" min="1" required>
                <label for="practiceFractionNumTotal">Total Fractions</label>
                <input type="number" id="practiceFractionNumTotal" min="1" required value="${totalFractionsFromRx}">
                <label for="practiceTreatmentDate">Treatment Date</label>
                <input type="date" id="practiceTreatmentDate" required value="${new Date().toISOString().split('T')[0]}">
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
                <label for="practiceTherapistInitials">Therapist(s) Initials</label>
                <input type="text" id="practiceTherapistInitials" required placeholder="e.g., JG, RS">
            </fieldset>

            <fieldset class="practice-fieldset">
                <legend>Setup, Delivery & IGRT</legend>
                <label for="practiceSetupVerification">Setup Verification</label>
                <select id="practiceSetupVerification">
                  <option value="Tolerances Met">Tolerances Met</option>
                  <option value="Adjustments Made">Adjustments Made</option>
                </select>
                <label for="practiceImmobilizationDevicesChecked">Immobilization Devices Checked</label>
                <input type="text" id="practiceImmobilizationDevicesChecked" placeholder="e.g., BodyFix bag, Belly board" value="${patientData?.radiationOncologyData?.ctSimulation?.immobilization || ''}">
                <label for="practiceSetupAdjustments">Setup Adjustments</label>
                <textarea id="practiceSetupAdjustments" rows="2" placeholder="Describe any repositioning"></textarea>
                <label for="practiceOrganTargetChecks">Organ/Target Checks</label>
                <textarea id="practiceOrganTargetChecks" rows="2" placeholder="e.g., CBCT reviewed, bowel position"></textarea>
                
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
                <label for="practiceShiftsApplied">Shifts Applied (V,L,L)</label>
                <input type="text" id="practiceShiftsApplied" placeholder="e.g., V:0.1, L:0, S:-0.2">
                <label for="practiceIgrtApprovedBy">IGRT Approved By (Initials/Role)</label>
                <input type="text" id="practiceIgrtApprovedBy" placeholder="e.g., RE (Physician), Physics">
                <label for="practiceIgrtVerificationNotes">IGRT Verification Notes</label>
                <textarea id="practiceIgrtVerificationNotes" rows="2" placeholder="Notes about image review/shifts"></textarea>
            </fieldset>

            <fieldset class="practice-fieldset">
                <legend>Patient Assessment & Notes</legend>
                <label for="practicePatientTolerance">Patient Tolerance</label>
                <select id="practicePatientTolerance">
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
                <label for="practiceGeneralSideEffects">General Side Effects</label>
                <textarea id="practiceGeneralSideEffects" rows="2" placeholder="e.g., Fatigue, nausea"></textarea>
                <label for="practiceSiteSpecificSideEffects">Site-Specific Side Effects</label>
                <textarea id="practiceSiteSpecificSideEffects" rows="2" placeholder="e.g., Abdominal discomfort, skin reaction"></textarea>
                <label for="practicePainAssessment">Pain Assessment</label>
                <input type="text" id="practicePainAssessment" placeholder="e.g., 0/10, Mild">
                <label for="practicePatientConcerns">Patient Concerns</label>
                <textarea id="practicePatientConcerns" rows="2" placeholder="Any questions or worries"></textarea>
                <label for="practiceInstructionsGiven">Instructions Given</label>
                <textarea id="practiceInstructionsGiven" rows="2" placeholder="e.g., Continue hydration, skin care"></textarea>
                <label for="practiceBillingCodes">Billing Codes (comma-separated)</label>
                <input type="text" id="practiceBillingCodes" placeholder="e.g., 77401, 77014">
                <label for="practiceDailyNotes">Therapist Daily Notes</label>
                <textarea id="practiceDailyNotes" rows="3" placeholder="Any other observations"></textarea>
            </fieldset>
            
            <fieldset class="practice-fieldset full-width">
                <legend>Per-Field Delivery Record (MUs)</legend>
                ${fieldEntryHtml}
            </fieldset>
        </div>
        <button type="button" id="addPracticeFractionBtn">Add Practice Fraction Entry</button>
      </form>
      <hr>
      <h4>Practice Fractions Entered This Session</h4>
      <table id="practiceFractionSessionTable" class="practice-table data-table" border="1" style="width:100%;max-width:900px;">
        <thead><tr>
          <th>Fraction</th><th>Date</th><th>Machine</th><th>Fields/MU Summary</th><th>Notes</th><th>Remove</th>
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

function renderTreatmentDelivery(data) {
  // Access data.dosimetry and data.treatmentDelivery directly from the 'data' object
  // which is already the 'radiationOncologyData' passed from showRadOncSubTab
  const dosimetryHtml = renderDosimetry(data.dosimetry);
  const td = data.treatmentDelivery || {};

  let fractionsSection = "";
  if (!td.fractions || !td.fractions.length) {
    fractionsSection = `<div class="section"><div class="section-header">Treatment Delivery Records</div><div class="section-content"><p>No Treatment Delivery records for this patient.</p></div></div>`;
  } else {
    fractionsSection = `<div class="section"><div class="section-header">Treatment Delivery Records</div><div class="section-content">
      <div class="fractions-container"> ${td.fractions.map(fx => {
        // Calculate total MUs for display if recordedFields is present
        const totalMUs = fx.recordedFields ? fx.recordedFields.reduce((sum, field) => sum + (field.deliveredMu || 0), 0) : 'N/A';
        const generalSideEffects = fx.generalSideEffects || fx.sideEffects || "None reported."; // Fallback for existing data
        const siteSpecificSideEffects = fx.siteSpecificSideEffects || ""; // Can be refined if more specific field exists

        return `
        <div class="fraction-card">
            <h4>Fraction ${fx.fractionNumber || ""} / ${fx.totalFractions || ""} - ${fx.date || ""}</h4>
            <p><strong>Machine:</strong> ${fx.machine || ""}</p>
            <p><strong>Therapist(s):</strong> ${fx.therapistInitials || ""}</p>
            <p><strong>Overall MUs:</strong> ${totalMUs}</p>
            
            <h5>Image Guidance (IGRT)</h5>
            <p><strong>Type:</strong> ${fx.imagingType || ""}, <strong>Match:</strong> ${fx.igrtMatchQuality || ""}</p>
            <p><strong>Shifts Applied:</strong> ${fx.shiftsApplied || "None"}</p>
            <p><strong>IGRT Notes:</strong> ${fx.igrtVerificationNotes || "N/A"}</p>
            
            <h5>Patient Assessment</h5>
            <p><strong>Tolerance:</strong> ${fx.patientTolerance || ""}</p>
            <p><b>Side Effects:</b> ${[generalSideEffects, siteSpecificSideEffects].filter(Boolean).join(', ') || "None reported."}</p>
            <p><strong>Concerns:</strong> ${fx.patientConcerns || "None"}</p>
            <p><strong>Pain:</strong> ${fx.painAssessment || "N/A"}</p>
            
            <h5>Daily Notes</h5>
            <p>${fx.dailyNotes || "No specific notes for today."}</p>

            <button class="toggle-details-btn" data-fraction-id="fraction-${fx.fractionNumber}">Show All Details</button>
            <div id="fraction-${fx.fractionNumber}" class="fraction-details-hidden">
                <h6>Detailed Delivery Data</h6>
                <p><strong>Energies Used:</strong> ${fx.energiesUsed || "N/A"}</p>
                <p><strong>Setup Verification:</strong> ${fx.setupVerification || "N/A"}</p>
                <p><strong>Immobilization Devices Checked:</strong> ${fx.immobilizationDevicesChecked || "N/A"}</p>
                <p><strong>Setup Adjustments:</strong> ${fx.setupAdjustments || "N/A"}</p>
                <p><strong>Organ/Target Checks:</strong> ${fx.organTargetChecks || "N/A"}</p>
                <p><strong>IGRT Approved By:</strong> ${fx.igrtApprovedBy || "N/A"}</p>
                <p><strong>Instructions Given:</strong> ${fx.instructionsGiven || "N/A"}</p>
                <p><strong>Billing Codes:</strong> ${fx.billingCodes || "N/A"}</p>

                <h6>Per-Field MU (Planned vs. Delivered)</h6>
                 <table class="data-table" border="1">
                    <thead>
                        <tr><th>Field Name</th><th>Delivered MU</th><th>Notes</th></tr>
                    </thead>
                    <tbody>
                        ${fx.recordedFields && fx.recordedFields.length > 0 ?
                            fx.recordedFields.map(field => `
                                <tr>
                                    <td>${field.fieldName || ""}</td>
                                    <td>${field.deliveredMu || ""}</td>
                                    <td>${field.notes || ""}</td>
                                </tr>
                            `).join('')
                            : '<tr><td colspan="3">No detailed field delivery data.</td></tr>'
                        }
                    </tbody>
                </table>
            </div>
        </div>
      `;}).join("")}
      </div>
    </div></div>`;
  }
  let formSection = `<div class="section"><div class="section-header">Practice Daily Treatment Entry</div><div class="section-content">${renderPracticeFractionEntryForm(currentPatientData)}</div></div>`;
  return dosimetryHtml + fractionsSection + formSection;
}

// ============================================================================================
// --- TAB AND SUB-TAB LOGIC FUNCTIONS ---
// These functions orchestrate which content is displayed. They must be defined AFTER
// all the render functions and handler initialization functions they call.
// ============================================================================================

function renderRadOncSubTabs(activeKey, data) {
  return `<div id="radOnc-subtabs" class="tab-bar" style="margin-bottom:1em;">
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

  const handleImageUpload = (event, previewElementId) => {
      const previewElement = document.getElementById(previewElementId);
      if (!previewElement) return;
      const file = event.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = function(e) { previewElement.src = e.target.result; }
          reader.readAsDataURL(file);
      }
  };

  switch (subKey) {
    case 'ctsim': 
      subContents.innerHTML = renderCTSimulation(radOncData.ctSimulation);
      const apUploader = document.getElementById('apImageUploader');
      const latUploader = document.getElementById('latImageUploader');
      if (apUploader) { apUploader.addEventListener('change', (event) => handleImageUpload(event, 'apImagePreview')); }
      if (latUploader) { latUploader.addEventListener('change', (event) => handleImageUpload(event, 'latImagePreview')); }
      const printBtn = document.getElementById('printCtsimBtn');
      if (printBtn) { printBtn.addEventListener('click', () => { window.print(); }); }
      break;
    case 'dosimetry': 
      subContents.innerHTML = renderDosimetry(radOncData.dosimetry); 
      break;
    case 'treatmentDelivery': 
      subContents.innerHTML = renderTreatmentDelivery(radOncData); 
      // These init functions MUST be called AFTER the content is rendered
      // and their definitions must appear EARLIER in the file.
      // Assuming initPracticeFractionFormHandlers is also defined elsewhere
      // and needs to be called after content render.
      initFractionDetailToggles(); 
      break;
    default: 
      subContents.innerHTML = "<p>No data.</p>"; 
      break;
  }
}

function showTab(tabKey, data) {
  const tabContents = document.getElementById('emr-tab-contents');
  if (!tabContents) return;
  document.querySelectorAll('#emr-tabs .tab-button').forEach(btn => btn.classList.remove('active'));
  const activeTabButton = document.getElementById(`emr-tab-btn-${tabKey}`);
  if (activeTabButton) activeTabButton.classList.add('active');

  if (tabKey === "radOnc") {
    // Render the sub-tab structure, then set up its event listeners and display default content
    tabContents.innerHTML = renderRadOncSubTabs("ctsim", data);
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
    showRadOncSubTab("ctsim", data); // Display the default sub-tab content (ctsim)
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

// ============================================================================================
// --- Patient Loader and Dropdown Logic ---
// These functions handle fetching data and updating the patient selection UI.
// They depend on `showTab` and `populatePatientDropdown`.
// ============================================================================================
let currentPatientData = null; // Global variable to hold the currently loaded patient data

function loadAndDisplayPatient(fileName) {
  fetch(fileName)
    .then(resp => {
      if (!resp.ok) throw new Error("Network response was not ok: " + resp.statusText);
      return resp.json();
    })
    .then(data => {
      currentPatientData = data; // Store loaded data globally
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
      showTab(emrTabs[0].key, data); // Display the first tab by default
    })
    .catch(error => {
      console.error('Error loading patient data:', error);
      document.getElementById('emr-tab-contents').innerHTML = `<div class="section"><div class="section-header" style="background-color: #d9534f;">Error</div><div class="section-content"><p>Could not load patient file: ${fileName}. Please check the console for details.</p></div></div>`;
    });
}

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
  const tabContents = document.getElementById('emr-tab-contents');
  const tabsDiv = document.getElementById('emr-tabs');
  if (searchValue === "") {
    populatePatientDropdown(patients);
    if (patients.length > 0) loadAndDisplayPatient(patients[0].file);
    return;
  }
  const filtered = patients.filter(p => p.diagnosisSearch && p.diagnosisSearch.toLowerCase().includes(searchValue));
  populatePatientDropdown(filtered);
  if (filtered.length > 0) {
    loadAndDisplayPatient(filtered[0].file);
  } else {
    if(tabsDiv) tabsDiv.innerHTML = '';
    if(tabContents) tabContents.innerHTML = `<p style="padding: 20px;">No matching patients found for "${searchValue}".</p>`;
  }
}

// ============================================================================================
// --- DOM Content Loaded Event Listener (Starts the application) ---
// This is the entry point, all functions called here must be defined earlier in the script.
// ============================================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Modal close button functionality
  const modalCloseBtn = document.getElementById('emr-modal-overlay')?.querySelector('.close-button'); // Corrected selector
  if (modalCloseBtn) {
    modalCloseBtn.onclick = function() {
      const overlay = document.getElementById('emr-modal-overlay');
      if (overlay) overlay.style.display = 'none';
      const viewer = document.getElementById('dicom-viewer');
      if (viewer) {
        try { cornerstone.disable(viewer); } catch(e) { /* Ignore if not enabled */ }
        viewer.innerHTML = ""; // Clear viewer content
      }
    };
  }

  // Initial patient dropdown population and display
  // 'patients' array is assumed to be defined in patients.js
  if (typeof patients !== 'undefined' && patients.length > 0) {
    populatePatientDropdown();
    loadAndDisplayPatient(patients[0].file); // Load the first patient by default
  } else {
    console.warn("`patients.js` or `patients` array is not defined. Please ensure it's loaded and contains patient data.");
    const tabContents = document.getElementById('emr-tab-contents');
    if (tabContents) tabContents.innerHTML = `<p style="padding: 20px;">Patient list not found or is empty. Please check 'patients.js'.</p>`;
  }

  // Event listener for patient dropdown change
  const patientSelect = document.getElementById('patientSelect');
  if (patientSelect) {
    patientSelect.addEventListener('change', function() {
      if (this.value) { loadAndDisplayPatient(this.value); }
    });
  }

  // Event listener for diagnosis search input
  const diagnosisSearch = document.getElementById('diagnosisSearch');
  if (diagnosisSearch) {
    diagnosisSearch.addEventListener('input', filterPatientsByDiagnosis);
  }
});
