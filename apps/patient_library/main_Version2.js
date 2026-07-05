import { CASE_LIBRARY } from './cases.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const caseSelect = document.getElementById('caseSelect');
    const scenarioPanel = document.getElementById('scenarioPanel');
    const ctViewerImage = document.getElementById('ctViewerImage');
    const isodoseOverlaySVG = document.getElementById('isodoseOverlaySVG');
    const planSummaryObjectives = document.getElementById('planSummaryObjectives');

    // Additional DOM elements as per your structure...
    // Example: gantryAngleInput, fieldSizeXInput, etc.

    // --- Case Loading Logic ---
    let currentCase = null;
    let currentStructures = {};
    let ctSliceImagePaths = [];
    let currentObjectives = [];

    // Populate case dropdown
    function populateCaseSelect() {
        caseSelect.innerHTML = '';
        CASE_LIBRARY.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            caseSelect.appendChild(opt);
        });
    }

    // Display scenario panel
    function showScenarioPanel(caseData) {
        scenarioPanel.innerHTML = `
            <h3>Scenario: ${caseData.name}</h3>
            <div class="mb-2">${caseData.description}</div>
            <b>Planning Challenges:</b>
            <ul>
                ${caseData.scenarioChallenges.map(item => `<li>• ${item}</li>`).join('')}
            </ul>
        `;
    }

    // Display objectives in plan summary (right panel)
    function showObjectives(caseData) {
        planSummaryObjectives.innerHTML = '';
        caseData.objectives.forEach(obj => {
            const row = document.createElement('div');
            row.innerHTML = `<b>${obj.label}:</b> <span class="objective-target">${obj.target} ${obj.unit}</span> <span style="color:gray; font-size:0.9em;">(${obj.description})</span>`;
            planSummaryObjectives.appendChild(row);
        });
    }

    // Set up CT images
    function setupCtImages(caseData) {
        ctSliceImagePaths = caseData.imageSet;
        ctViewerImage.src = ctSliceImagePaths[24]; // Start on middle slice
    }

    // Set up structures (overlays)
    function setupStructures(caseData) {
        // Remove all existing overlays
        Array.from(document.querySelectorAll('.structure-overlay')).forEach(el => el.remove());
        currentStructures = JSON.parse(JSON.stringify(caseData.structures));
        Object.values(currentStructures).forEach(s => {
            const overlay = document.createElement('div');
            overlay.id = s.id + '_overlay';
            overlay.className = `structure-overlay ${s.type === "PTV" ? 'ptv-overlay' : 'oar-overlay'}`;
            overlay.textContent = s.name;
            overlay.style.left = `${s.x}%`;
            overlay.style.top = `${s.y}%`;
            overlay.style.width = `${s.w}%`;
            overlay.style.height = `${s.h}%`;
            overlay.style.backgroundColor = s.color;
            overlay.style.borderColor = s.borderColor;
            if (s.shapeParams?.borderRadius) overlay.style.borderRadius = s.shapeParams.borderRadius;
            if (s.shapeParams?.transform) overlay.style.transform = s.shapeParams.transform;
            overlay.style.display = s.visible !== false ? 'flex' : 'none';
            document.querySelector('.viewer-area').appendChild(overlay);
        });
    }

    // Main function to load a selected case
    function loadCase(caseId) {
        currentCase = CASE_LIBRARY.find(c => c.id === caseId);
        if (!currentCase) return;
        showScenarioPanel(currentCase);
        showObjectives(currentCase);
        setupCtImages(currentCase);
        setupStructures(currentCase);
        // TODO: Reset beams, DVH, plan summary, etc. as needed for new case.
    }

    // React to case selection
    caseSelect.addEventListener('change', () => {
        loadCase(caseSelect.value);
    });

    // On page load
    populateCaseSelect();
    loadCase(CASE_LIBRARY[0].id); // Load first case by default

    // ... Rest of your main.js functionality for planning, DVH, etc. goes here ...
    // Use currentStructures and ctSliceImagePaths for plan logic.
});