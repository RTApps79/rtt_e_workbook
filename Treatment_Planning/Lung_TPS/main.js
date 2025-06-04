/**
 * lung_tps_script.js
 * Main JavaScript for the Lung TPS: Forward & Inverse Planning Concepts Simulator
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    // Workflow
    const wfStep1 = document.getElementById('wf-step1');
    const wfStep2 = document.getElementById('wf-step2');
    const wfStep3 = document.getElementById('wf-step3');
    const wfStep4 = document.getElementById('wf-step4');

    // Patient & Imaging
    const ctSliceSlider = document.getElementById('ctSliceSlider');
    const ctSliceValueText = document.getElementById('ctSliceValueText');
    const ctViewerImage = document.getElementById('ctViewerImage');
    const viewerArea = document.querySelector('.viewer-area');

    // Structure Definition
    const structureSelector = document.getElementById('structureSelector');
    const toggleStructureVisibilityBtn = document.getElementById('toggleStructureVisibilityBtn');
    const editStructureBtn = document.getElementById('editStructureBtn');
    const structureEditorDiv = document.getElementById('structureEditor');
    const editingStructureNameSpan = document.getElementById('editingStructureName');
    const structureSliders = document.querySelectorAll('.structure-slider');

    // Planning Mode & Tabs
    const tabForwardPlanning = document.getElementById('tabForwardPlanning');
    const tabInversePlanning = document.getElementById('tabInversePlanning');
    const forwardPlanningTabContent = document.getElementById('forwardPlanningTabContent');
    const inversePlanningTabContent = document.getElementById('inversePlanningTabContent');
    const planTypeText = document.getElementById('planTypeText');

    // Forward Planning
    const gantryAngleInput = document.getElementById('gantryAngle');
    const fieldSizeXInput = document.getElementById('fieldSizeX');
    const fieldSizeYInput = document.getElementById('fieldSizeY');
    const beamWeightInput = document.getElementById('beamWeight');
    const addBeamBtn = document.getElementById('addBeamBtn');
    const applyBeamSettingsBtn = document.getElementById('applyBeamSettingsBtn');
    const clearBeamsBtn = document.getElementById('clearBeamsBtn');

    // Inverse Planning
    const ptvD95Input = document.getElementById('ptvD95');
    const cordMaxInput = document.getElementById('cordMax');
    const lungV20Input = document.getElementById('lungV20');
    const lungMeanInput = document.getElementById('lungMean');
    const heartMeanInput = document.getElementById('heartMean');
    const heartV30Input = document.getElementById('heartV30');
    const simulateImrtBtn = document.getElementById('simulateImrtBtn');

    // Right Panel: Evaluation
    const beamListDiv = document.getElementById('beamList');
    const bevPlaceholderDiv = document.getElementById('bevPlaceholder');
    const dvhChartCanvas = document.getElementById('dvhChartCanvas').getContext('2d');
    const isodoseOverlaySVG = document.getElementById('isodoseOverlaySVG');
    const approvePlanBtn = document.getElementById('approvePlanBtn');

    // Plan Summary Spans
    const summaryPtvD95 = document.getElementById('summary_PTV_D95');
    const summaryCordMax = document.getElementById('summary_Cord_Max');
    const summaryLungV20 = document.getElementById('summary_Lung_V20');
    const summaryLungMean = document.getElementById('summary_Lung_Mean');
    const summaryHeartMean = document.getElementById('summary_Heart_Mean');
    const summaryHeartV30 = document.getElementById('summary_Heart_V30');

    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // --- Application State ---
    let currentPlanningMode = 'forward'; // 'forward' or 'inverse'
    let beams = [];
    let selectedBeamIndex = -1;
    let currentEditingStructureId = null;
    let ctSliceImagePaths = []; // To be populated with actual or placeholder image paths

    // Structure data: x, y, w, h are percentages relative to viewerArea
    // Added Carina and T4T5 landmarks
    const structures = {
        "PTV_Lung":         { id: "PTV_Lung", element: document.getElementById('PTV_Lung_overlay'), visible: true, name: "PTV Lung Tumor", type: "PTV", color: 'rgba(250, 204, 21, 0.3)', borderColor: '#facc15', x: 45, y: 40, w: 15, h: 25, shapeParams: { borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' } },
        "OAR_Lung_L":       { id: "OAR_Lung_L", element: document.getElementById('OAR_Lung_L_overlay'), visible: true, name: "Left Lung", type: "OAR", color: 'rgba(34, 197, 94, 0.3)', borderColor: '#22c55e', x: 20, y: 25, w: 25, h: 55, shapeParams: { borderRadius: '40% 10% 10% 60% / 50% 10% 10% 50%' } },
        "OAR_Lung_R":       { id: "OAR_Lung_R", element: document.getElementById('OAR_Lung_R_overlay'), visible: true, name: "Right Lung", type: "OAR", color: 'rgba(34, 197, 94, 0.3)', borderColor: '#22c55e', x: 55, y: 25, w: 25, h: 55, shapeParams: { borderRadius: '10% 40% 60% 10% / 10% 50% 50% 10%' } },
        "OAR_SpinalCord":   { id: "OAR_SpinalCord", element: document.getElementById('OAR_SpinalCord_overlay'), visible: true, name: "Spinal Cord", type: "OAR", color: 'rgba(239, 68, 68, 0.4)', borderColor: '#ef4444', x: 48, y: 45, w: 4, h: 15, shapeParams: { borderRadius: '5px' } },
        "OAR_Heart":        { id: "OAR_Heart", element: document.getElementById('OAR_Heart_overlay'), visible: true, name: "Heart", type: "OAR", color: 'rgba(217, 70, 239, 0.3)', borderColor: '#d946ef', x: 35, y: 55, w: 20, h: 20, shapeParams: { borderRadius: '50% 50% 20% 20%' } },
        "OAR_Esophagus":    { id: "OAR_Esophagus", element: document.getElementById('OAR_Esophagus_overlay'), visible: true, name: "Esophagus", type: "OAR", color: 'rgba(245, 158, 11, 0.4)', borderColor: '#f59e0b', x: 53, y: 48, w: 3, h: 10, shapeParams: { borderRadius: '3px' } },
        "LANDMARK_Carina":  { id: "LANDMARK_Carina", element: document.getElementById('LANDMARK_Carina_overlay'), visible: true, name: "Carina", type: "LANDMARK", color: 'rgba(139, 92, 246, 0.25)', borderColor: '#8b5cf6', x: 47, y: 30, w: 6, h: 5, shapeParams: { borderRadius: '40% 40% 20% 20%' } },
        "LANDMARK_T4T5":    { id: "LANDMARK_T4T5", element: document.getElementById('LANDMARK_T4T5_overlay'), visible: true, name: "T4/T5 Vertebra", type: "LANDMARK", color: 'rgba(139, 92, 246, 0.35)', borderColor: '#8b5cf6', x: 47.5, y: 32, w: 5, h: 8, shapeParams: { borderRadius: '3px' } }
    };

    // --- DVH Chart Instance ---
    const dvhChart = new Chart(dvhChartCanvas, {
        type: 'line',
        data: {
            labels: Array.from({ length: 101 }, (_, i) => i.toString()), // Dose 0-100 Gy
            datasets: [] // Populated by updateDVH
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Dose (Gy)', font: {size: 10}}, ticks: {font: {size: 9}}},
                y: { title: { display: true, text: 'Volume (%)', font: {size: 10}}, min: 0, max: 100, ticks: {font: {size: 9}}}
            },
            plugins: { legend: { display: true, position: 'top', labels: {font: {size: 9}, boxWidth:10, padding:5 } } },
            animation: { duration: 200 }
        }
    });

    // --- Workflow Management ---
    function updateWorkflowStep(stepElement, isComplete = true) {
        if (stepElement) {
            if (isComplete) stepElement.classList.add('workflow-step-done');
            else stepElement.classList.remove('workflow-step-done');
        }
    }

    // --- CT Slice Simulation ---
    function populateCtSliceImages() {
        ctSliceImagePaths = Array.from({ length: 50 }, (_, i) => `https://placehold.co/600x500/111827/4b5563?text=Lung+Slice+${i + 1}`);
        // On a real system, these would be actual image paths or data URLs
        ctViewerImage.src = ctSliceImagePaths[parseInt(ctSliceSlider.value) - 1];
    }
    ctSliceSlider.addEventListener('input', () => {
        const sliceNum = parseInt(ctSliceSlider.value);
        ctSliceValueText.textContent = sliceNum;
        if (ctSliceImagePaths[sliceNum - 1]) {
            ctViewerImage.src = ctSliceImagePaths[sliceNum - 1];
        }
        // Conceptually, structure positions might change slightly with slice.
        // For simplicity, we'll make them bob a bit.
        Object.values(structures).forEach(s => {
            if (s.element && s.type !== 'LANDMARK') { // Landmarks might be more fixed on a specific slice
                s.element.style.transform = `translateY(${(sliceNum - 25) * 0.08}%)`;
            }
        });
        drawSimulatedIsodose(); // Isodoses are slice-specific
        updateWorkflowStep(wfStep1);
    });

    // --- Structure Management ---
    function updateStructureVisuals() {
        Object.values(structures).forEach(s => {
            if (s.element) {
                s.element.style.display = s.visible ? 'block' : 'none';
                s.element.style.left = `${s.x}%`;
                s.element.style.top = `${s.y}%`;
                s.element.style.width = `${s.w}%`;
                s.element.style.height = `${s.h}%`;
                s.element.style.backgroundColor = s.color;
                s.element.style.borderColor = s.borderColor;
                if (s.shapeParams && s.shapeParams.borderRadius) {
                    s.element.style.borderRadius = s.shapeParams.borderRadius;
                }
            }
        });
    }

    toggleStructureVisibilityBtn.addEventListener('click', () => {
        const selectedId = structureSelector.value;
        if (structures[selectedId]) {
            structures[selectedId].visible = !structures[selectedId].visible;
            updateStructureVisuals();
            updateDVH(); // Visibility affects DVH
            updateWorkflowStep(wfStep2);
        }
    });

    editStructureBtn.addEventListener('click', () => {
        currentEditingStructureId = structureSelector.value;
        const s = structures[currentEditingStructureId];
        if (s) {
            structureEditorDiv.classList.remove('hidden');
            editingStructureNameSpan.textContent = s.name;
            structureSliders.forEach(slider => {
                const param = slider.dataset.param;
                slider.value = s[param];
                slider.nextElementSibling.textContent = s[param];
            });
        } else {
            structureEditorDiv.classList.add('hidden');
            currentEditingStructureId = null;
        }
    });

    structureSliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            if (currentEditingStructureId && structures[currentEditingStructureId]) {
                const param = e.target.dataset.param;
                const value = parseInt(e.target.value);
                structures[currentEditingStructureId][param] = value;
                e.target.nextElementSibling.textContent = value;
                updateStructureVisuals();
                updateDVH();
                drawSimulatedIsodose();
                 updateWorkflowStep(wfStep2);
            }
        });
    });

    // --- Planning Mode Switching ---
    function switchPlanningMode(mode) {
        currentPlanningMode = mode;
        if (mode === 'forward') {
            tabForwardPlanning.classList.add('active');
            tabInversePlanning.classList.remove('active');
            forwardPlanningTabContent.classList.remove('hidden');
            inversePlanningTabContent.classList.add('hidden');
            planTypeText.textContent = "Current Mode: Forward Planning (3D CRT)";
            clearBeams(); // Clear beams when switching to forward, or adapt if desired
        } else { // inverse
            tabForwardPlanning.classList.remove('active');
            tabInversePlanning.classList.add('active');
            forwardPlanningTabContent.classList.add('hidden');
            inversePlanningTabContent.classList.remove('hidden');
            planTypeText.textContent = "Current Mode: Inverse Planning (IMRT Concept)";
            clearBeams(); // Clear beams for IMRT sim, it will generate its own
        }
        updateDVH(); // Recalculate DVH for new mode
        drawSimulatedIsodose();
        updateBeamListDisplay();
        updateWorkflowStep(wfStep3);
    }
    tabForwardPlanning.addEventListener('click', () => switchPlanningMode('forward'));
    tabInversePlanning.addEventListener('click', () => switchPlanningMode('inverse'));

    // --- Forward Planning: Beam Management ---
    function createBeamVisualElement(beam, index) {
        const beamDiv = document.createElement('div');
        beamDiv.classList.add('beam-icon');
        beamDiv.innerHTML = '&#9650;'; // Up arrow
        beamDiv.style.color = (index === selectedBeamIndex) ? '#FFD700' : '#60A5FA'; // Gold if selected, else blue
        beamDiv.style.transform = `translate(-50%, -100%) rotate(${beam.angle}deg)`;

        const viewerWidth = viewerArea.offsetWidth;
        const viewerHeight = viewerArea.offsetHeight;
        const radius = Math.min(viewerWidth, viewerHeight) * 0.48; // Position around edge
        const radAngle = (beam.angle - 90) * Math.PI / 180; // 0 deg is top
        const beamX = viewerWidth / 2 + radius * Math.cos(radAngle);
        const beamY = viewerHeight / 2 + radius * Math.sin(radAngle);
        beamDiv.style.left = `${beamX}px`;
        beamDiv.style.top = `${beamY}px`;
        viewerArea.appendChild(beamDiv);

        const beamLine = document.createElement('div');
        beamLine.classList.add('beam-line');
        const lineLength = radius * 0.85; // Line goes towards center
        beamLine.style.width = `${lineLength}px`;
        beamLine.style.height = '3px';
        beamLine.style.backgroundColor = (index === selectedBeamIndex) ? 'rgba(255, 215, 0, 0.7)' : 'rgba(96, 165, 250, 0.5)';
        beamLine.style.opacity = 0.4 + (beam.weight / 100 * 0.6);
        beamLine.style.left = `${beamX}px`;
        beamLine.style.top = `${beamY}px`;
        beamLine.style.transformOrigin = `0% 50%`;
        beamLine.style.transform = `rotate(${beam.angle}deg)`;
        viewerArea.appendChild(beamLine);

        beamDiv.addEventListener('click', () => selectBeam(index));
        return { icon: beamDiv, line: beamLine };
    }

    function renderForwardBeams() {
        viewerArea.querySelectorAll('.beam-icon, .beam-line').forEach(el => el.remove());
        beams.forEach((beam, index) => {
            createBeamVisualElement(beam, index);
        });
        updateBeamListDisplay();
        updateDVH();
        drawSimulatedIsodose();
        if (selectedBeamIndex !== -1 && beams[selectedBeamIndex]) {
            bevPlaceholderDiv.textContent = `BEV: Target from ${beams[selectedBeamIndex].angle}° (FS: ${beams[selectedBeamIndex].sizeX}x${beams[selectedBeamIndex].sizeY} W:${beams[selectedBeamIndex].weight})`;
        } else {
            bevPlaceholderDiv.textContent = "Conceptual BEV";
        }
    }

    function updateBeamListDisplay() {
        beamListDiv.innerHTML = '';
        if (currentPlanningMode === 'forward' && beams.length > 0) {
            beams.forEach((beam, index) => {
                const item = document.createElement('div');
                item.className = `flex justify-between items-center p-1 rounded mb-0.5 cursor-pointer ${index === selectedBeamIndex ? 'bg-indigo-200' : 'bg-slate-100'}`;
                item.innerHTML = `<span>B${index + 1} (G:${beam.angle}°, FS:${beam.sizeX}x${beam.sizeY}, W:${beam.weight})</span>
                                  <button class="text-red-500 text-xs delete-beam hover:font-bold" data-index="${index}">X</button>`;
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-beam')) selectBeam(index);
                });
                beamListDiv.appendChild(item);
            });
            beamListDiv.querySelectorAll('.delete-beam').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const indexToDelete = parseInt(e.target.dataset.index);
                    beams.splice(indexToDelete, 1);
                    if (selectedBeamIndex === indexToDelete) selectedBeamIndex = -1;
                    else if (selectedBeamIndex > indexToDelete) selectedBeamIndex--;
                    renderForwardBeams();
                });
            });
        } else if (currentPlanningMode === 'inverse' && beams.length > 0) { // Special display for IMRT
             beamListDiv.innerHTML = `<div class="p-1 bg-slate-100 rounded text-center">Simulated IMRT Plan Active (${beams.length} conceptual modulated fields)</div>`;
             bevPlaceholderDiv.textContent = "IMRT: Multiple Modulated Fields";
        } else {
            beamListDiv.innerHTML = '<div class="p-1 text-slate-400 text-center">No beams defined.</div>';
            bevPlaceholderDiv.textContent = "Conceptual BEV";
        }
    }

    function selectBeam(index) {
        if (currentPlanningMode !== 'forward') return;
        selectedBeamIndex = index;
        const beam = beams[index];
        if (beam) {
            gantryAngleInput.value = beam.angle;
            fieldSizeXInput.value = beam.sizeX;
            fieldSizeYInput.value = beam.sizeY;
            beamWeightInput.value = beam.weight;
        }
        renderForwardBeams();
    }

    addBeamBtn.addEventListener('click', () => {
        if (currentPlanningMode !== 'forward') return;
        beams.push({
            angle: parseInt(gantryAngleInput.value),
            sizeX: parseInt(fieldSizeXInput.value),
            sizeY: parseInt(fieldSizeYInput.value),
            weight: parseInt(beamWeightInput.value)
        });
        selectedBeamIndex = beams.length - 1;
        renderForwardBeams();
        updateWorkflowStep(wfStep3);
    });

    applyBeamSettingsBtn.addEventListener('click', () => {
        if (currentPlanningMode !== 'forward' || selectedBeamIndex === -1 || !beams[selectedBeamIndex]) {
            if (typeof alert !== 'undefined') alert('Please select a beam in Forward Planning mode to apply settings.');
            return;
        }
        beams[selectedBeamIndex].angle = parseInt(gantryAngleInput.value);
        beams[selectedBeamIndex].sizeX = parseInt(fieldSizeXInput.value);
        beams[selectedBeamIndex].sizeY = parseInt(fieldSizeYInput.value);
        beams[selectedBeamIndex].weight = parseInt(beamWeightInput.value);
        renderForwardBeams();
    });

    function clearBeams() {
        beams = [];
        selectedBeamIndex = -1;
        if (currentPlanningMode === 'forward') {
            renderForwardBeams();
        } else { // For inverse, just update display
            updateBeamListDisplay();
            updateDVH();
            drawSimulatedIsodose();
        }
    }
    clearBeamsBtn.addEventListener('click', clearBeams);


    // --- Inverse Planning (IMRT Simulation) ---
    simulateImrtBtn.addEventListener('click', () => {
        if (currentPlanningMode !== 'inverse') return;
        // This is a conceptual simulation.
        // 1. Generate a set of "dummy" beams to represent an IMRT plan
        beams = []; // Clear any previous (though mode switch should do this)
        const numImrtBeams = 7; // e.g., 7-9 beams for IMRT
        for (let i = 0; i < numImrtBeams; i++) {
            beams.push({
                angle: Math.round((360 / numImrtBeams) * i + Math.random() * 10 - 5) % 360, // Spread out, with some randomness
                sizeX: Math.round(6 + Math.random() * 4), // Smaller, varied field sizes
                sizeY: Math.round(8 + Math.random() * 6),
                weight: Math.round(30 + Math.random() * 40) // Varied weights
            });
        }
        // 2. Update DVH to "try" and meet objectives
        updateDVH(true); // Pass a flag to indicate IMRT simulation for DVH logic
        drawSimulatedIsodose();
        updateBeamListDisplay(); // Show "IMRT Plan Active"
        updateWorkflowStep(wfStep3);
        if (typeof alert !== 'undefined') alert('IMRT optimization simulated! Check DVH and Plan Summary.');
        else console.log('IMRT optimization simulated! Check DVH and Plan Summary.');
    });


    // --- DVH Calculation (Conceptual) ---
    function calculateDVHPoint(baseVolume, dose, targetScore, oarSensitivity, isPTV) {
        let volume = baseVolume;
        if (isPTV) { // PTV: steep fall-off around target dose
            const targetDose = targetScore; // targetScore is effectively the dose for 95% volume
            if (dose < targetDose * 0.9) volume = 100;
            else if (dose < targetDose * 1.05) volume = Math.max(5, 100 - (dose - targetDose * 0.9) * (95 / (targetDose * 0.15 + 1)));
            else volume = Math.max(0, 5 - (dose - targetDose * 1.05) * 0.8);
        } else { // OAR: gentler slope, influenced by sensitivity
            const toleranceDose = 100 - oarSensitivity; // Higher sensitivity = lower tolerance
            if (dose < toleranceDose * 0.3) volume = 90 - oarSensitivity * 0.2;
            else if (dose < toleranceDose * 0.8) volume = Math.max(0, (90 - oarSensitivity*0.2) - (dose - toleranceDose*0.3) * ( (90 - oarSensitivity*0.2) / (toleranceDose*0.5 +1) ) );
            else volume = 0;
        }
        return Math.max(0, Math.min(100, volume));
    }

    function updateDVH(isImrtSim = false) {
        const datasets = [];
        const doseValues = Array.from({ length: 101 }, (_, i) => i); // 0-100 Gy

        // PTV (Lung Tumor)
        const ptv = structures["PTV_Lung"];
        if (ptv && ptv.visible) {
            let ptvTargetScore = 0; // Effective dose for D95%
            if (currentPlanningMode === 'forward' && beams.length > 0) {
                let totalWeightEffect = 0;
                beams.forEach(b => { totalWeightEffect += b.weight * ( (b.sizeX*b.sizeY) / (ptv.w * ptv.h * 5) ); }); // Normalize by PTV area
                ptvTargetScore = Math.min(95, 20 + totalWeightEffect / beams.length * 2.5); // Conceptual score
            } else if (currentPlanningMode === 'inverse') {
                ptvTargetScore = parseFloat(ptvD95Input.value) || 60; // Use IMRT objective
                if (isImrtSim) ptvTargetScore *= 1.02; // Simulate slightly better than objective
            }

            datasets.push({
                label: ptv.name,
                data: doseValues.map(dose => calculateDVHPoint(100, dose, ptvTargetScore, 0, true)),
                borderColor: ptv.borderColor, backgroundColor: ptv.color, fill: true, tension: 0.2,
                pointRadius: 0, borderWidth: 1.5
            });
        }

        // OARs
        Object.values(structures).forEach(s => {
            if (s.type === "OAR" && s.visible) {
                let oarSensitivityScore = 0; // Higher score = more sensitive / receives more dose
                if (currentPlanningMode === 'forward' && beams.length > 0) {
                    beams.forEach(beam => {
                        // Highly simplified geometric "hit" check
                        const beamCenterRad = (beam.angle - 90) * Math.PI / 180;
                        const beamDirX = Math.cos(beamCenterRad);
                        const beamDirY = Math.sin(beamCenterRad);
                        const ptvCenterX = ptv.x + ptv.w / 2; const ptvCenterY = ptv.y + ptv.h / 2;
                        const sCenterX = s.x + s.w / 2; const sCenterY = s.y + s.h / 2;
                        // If OAR is generally in the direction of the beam from PTV's perspective
                        const dotProduct = beamDirX * (sCenterX - ptvCenterX) + beamDirY * (sCenterY - ptvCenterY);
                        if (dotProduct > 0) { // OAR is "downstream"
                           oarSensitivityScore += beam.weight * 0.3; // Base sensitivity
                           if (s.id === "OAR_SpinalCord") oarSensitivityScore += beam.weight * 0.2; // Cord more sensitive
                           if (s.id === "OAR_Heart") oarSensitivityScore += beam.weight * 0.1;
                        }
                    });
                    oarSensitivityScore = Math.min(90, beams.length > 0 ? oarSensitivityScore / beams.length * 1.5 : 10);
                } else if (currentPlanningMode === 'inverse') {
                    // For IMRT, try to meet objectives
                    if (s.id === "OAR_SpinalCord") oarSensitivityScore = 100 - (parseFloat(cordMaxInput.value) * 0.8); // Aim below max
                    else if (s.id.includes("Lung")) oarSensitivityScore = (parseFloat(lungV20Input.value) / 2 + parseFloat(lungMeanInput.value)) / 2;
                    else if (s.id === "OAR_Heart") oarSensitivityScore = (parseFloat(heartMeanInput.value) + parseFloat(heartV30Input.value)/2) / 2;
                    else oarSensitivityScore = 30; // Generic OAR
                    if (isImrtSim) oarSensitivityScore *= 0.85; // IMRT better at sparing
                }
                oarSensitivityScore = Math.max(10, Math.min(90, oarSensitivityScore));


                datasets.push({
                    label: s.name,
                    data: doseValues.map(dose => calculateDVHPoint(100, dose, 0, oarSensitivityScore, false)),
                    borderColor: s.borderColor, backgroundColor: 'transparent', fill: false, tension: 0.2,
                    borderDash: [3, 3], pointRadius: 0, borderWidth: 1.5
                });
            }
        });
        dvhChart.data.datasets = datasets;
        dvhChart.update();
        updatePlanSummaryUI();
        updateWorkflowStep(wfStep4);
    }

    // --- Isodose Simulation ---
    function drawSimulatedIsodose() {
        isodoseOverlaySVG.innerHTML = '';
        if (beams.length === 0 && currentPlanningMode === 'forward') return;

        const ptv = structures["PTV_Lung"];
        if (!ptv || !ptv.element || !ptv.visible) return;

        const ptvRect = { x: ptv.x, y: ptv.y, w: ptv.w, h: ptv.h }; // % values
        const ptvCenterX = ptvRect.x + ptvRect.w / 2;
        const ptvCenterY = ptvRect.y + ptvRect.h / 2;

        let compositeEffect = { x: 0, y: 0, intensity: 0, spread: 1 };
        let beamCount = 0;

        if (currentPlanningMode === 'forward' && beams.length > 0) {
            beamCount = beams.length;
            beams.forEach(b => {
                const rad = (b.angle - 90) * Math.PI / 180;
                compositeEffect.x += Math.cos(rad) * b.weight;
                compositeEffect.y += Math.sin(rad) * b.weight;
                compositeEffect.intensity += b.weight;
                compositeEffect.spread += (b.sizeX + b.sizeY) / 20; // Avg field size / 10
            });
            if (beamCount > 0) {
                compositeEffect.x /= (compositeEffect.intensity + 1); // Normalize shift
                compositeEffect.y /= (compositeEffect.intensity + 1);
                compositeEffect.intensity /= beamCount;
                compositeEffect.spread /= beamCount;
            }
        } else if (currentPlanningMode === 'inverse') { // IMRT tends to be more conformal
            beamCount = beams.length || 7; // Assume 7 conceptual beams for IMRT if none explicitly defined
            compositeEffect.intensity = parseFloat(ptvD95Input.value) || 60; // Intensity related to PTV dose
            compositeEffect.spread = 0.8; // Tighter spread for IMRT
        } else { return; }


        const shiftX = compositeEffect.x * 5; // % shift
        const shiftY = compositeEffect.y * 5;
        const baseRadiusFactor = Math.min(1, compositeEffect.intensity / 60); // Scale with intensity (60Gy as ref)

        const isoColors = { high: '#16a34a', medium: '#facc15', low: '#60a5fa' }; // Green, Yellow, Blue

        // High dose (e.g., 95% of Rx)
        createIsodosePath(ptvCenterX + shiftX, ptvCenterY + shiftY, ptvRect.w * 0.5 * baseRadiusFactor, ptvRect.h * 0.7 * baseRadiusFactor, isoColors.high, 0.6, ptv.shapeParams.borderRadius);
        // Medium dose (e.g., 50% of Rx)
        createIsodosePath(ptvCenterX + shiftX, ptvCenterY + shiftY, ptvRect.w * (0.8 * baseRadiusFactor * compositeEffect.spread), ptvRect.h * (1.0 * baseRadiusFactor * compositeEffect.spread), isoColors.medium, 0.4, '50%');
        // Low dose (e.g., 20% of Rx)
        createIsodosePath(ptvCenterX + shiftX, ptvCenterY + shiftY, ptvRect.w * (1.2 * baseRadiusFactor * compositeEffect.spread * 1.2), ptvRect.h * (1.4 * baseRadiusFactor * compositeEffect.spread * 1.2), isoColors.low, 0.25, '50%');
    }

    function createIsodosePath(cx_pct, cy_pct, rx_pct, ry_pct, fillColor, opacity, borderRadius = '50%') {
        // For simplicity, using ellipse. A path could be more complex.
        const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        ellipse.setAttribute("cx", `${Math.max(5,Math.min(95,cx_pct))}%`);
        ellipse.setAttribute("cy", `${Math.max(5,Math.min(95,cy_pct))}%`);
        ellipse.setAttribute("rx", `${Math.max(1,rx_pct)}%`);
        ellipse.setAttribute("ry", `${Math.max(1,ry_pct)}%`);
        ellipse.style.fill = fillColor;
        ellipse.style.opacity = opacity;
        // Note: SVG ellipse doesn't directly support complex border-radius like CSS.
        // This is a simplification. For true shape following, would need <path> and complex calculations.
        isodoseOverlaySVG.appendChild(ellipse);
    }

    // --- Plan Summary UI Update ---
    function getDVHMetric(structureName, doseLevel, isMaxDose = false, isVolumeAtDose = true) {
        const dataset = dvhChart.data.datasets.find(ds => ds.label === structureName);
        if (!dataset) return "N/A";
        const doseValues = dvhChart.data.labels.map(l => parseFloat(l));

        if (isMaxDose) { // Find dose where volume drops to (near) zero
            for (let i = doseValues.length - 1; i >= 0; i--) {
                if (dataset.data[i] > 1) return doseValues[i].toFixed(1) + " Gy"; // Dose at which >1% volume exists
            }
            return "<5 Gy";
        } else if (isVolumeAtDose) { // V_doseGy
            const index = doseValues.findIndex(d => d >= doseLevel);
            if (index !== -1) return dataset.data[index].toFixed(1) + "%";
        } else { // D_volume% (e.g. D95%)
            for (let i = 0; i < doseValues.length; i++) {
                if (dataset.data[i] <= doseLevel) return doseValues[i].toFixed(1) + " Gy";
            }
            const lastDose = doseValues[doseValues.length-1];
            return `>${lastDose.toFixed(1)} Gy`; // All volume received more than max dose shown
        }
        return "N/A";
    }

    function updatePlanSummaryUI() {
        summaryPtvD95.textContent = getDVHMetric(structures["PTV_Lung"].name, 95, false, false); // D95%
        summaryCordMax.textContent = getDVHMetric(structures["OAR_SpinalCord"].name, 0, true);
        summaryLungV20.textContent = getDVHMetric(structures["OAR_Lung_L"].name, 20) + " (L), " + getDVHMetric(structures["OAR_Lung_R"].name, 20) + " (R)"; // Simplified, could be total
        // For mean dose, we'd need to integrate under DVH curve - too complex for this sim. Using placeholder.
        summaryLungMean.textContent = "Conceptual";
        summaryHeartMean.textContent = "Conceptual";
        summaryHeartV30.textContent = getDVHMetric(structures["OAR_Heart"].name, 30);

        // Style based on meeting conceptual goals (very simplified)
        const ptvD95Val = parseFloat(summaryPtvD95.textContent);
        summaryPtvD95.className = `font-semibold ${ptvD95Val >= (currentPlanningMode === 'inverse' ? parseFloat(ptvD95Input.value) : 57) ? 'text-green-600' : 'text-red-600'}`;

        const cordMaxVal = parseFloat(summaryCordMax.textContent);
        summaryCordMax.className = `font-semibold ${cordMaxVal <= (currentPlanningMode === 'inverse' ? parseFloat(cordMaxInput.value) : 48) ? 'text-green-600' : 'text-red-600'}`;
    }

    approvePlanBtn.addEventListener('click', () => {
        if (typeof alert !== 'undefined') alert("Plan Approved! (Conceptual Action)");
        else console.log("Plan Approved! (Conceptual Action)");
        // Could add further logic here, e.g., locking the plan.
    });


    // --- Initialization ---
    function initializeTPS() {
        populateCtSliceImages();
        updateStructureVisuals();
        switchPlanningMode('forward'); // Default to forward planning
        updateWorkflowStep(wfStep1); // Mark imaging as 'done' initially
        updateWorkflowStep(wfStep2); // Mark structures as 'done' initially (user can still edit)

        // Expose elements and functions needed by the tutorial via a global object
        // This is a common way to bridge, but a more robust system might use events or a shared state manager.
        window.lungTpsContext = {
            // State
            get beams() { return beams; },
            get structures() { return structures; },
            get currentPlanningMode() { return currentPlanningMode; },
            // DOM Elements
            gantryAngleInput, fieldSizeXInput, fieldSizeYInput, beamWeightInput, addBeamBtn,
            applyBeamSettingsBtn, beamListDiv, clearBeamsBtn, dvhChartCanvas: dvhChartCanvas.canvas, // pass canvas element
            isodoseOverlaySVG, planTypeText, bevPlaceholderDiv,
            ptvD95Input, cordMaxInput, lungV20Input, lungMeanInput, heartMeanInput, heartV30Input, simulateImrtBtn,
            summary_PTV_D95: summaryPtvD95, // Pass the span itself
            // Structure Overlays (pass the DOM elements directly)
            PTV_Lung_overlay: structures["PTV_Lung"].element,
            OAR_Lung_L_overlay: structures["OAR_Lung_L"].element,
            OAR_Lung_R_overlay: structures["OAR_Lung_R"].element,
            OAR_SpinalCord_overlay: structures["OAR_SpinalCord"].element,
            OAR_Heart_overlay: structures["OAR_Heart"].element,
            OAR_Esophagus_overlay: structures["OAR_Esophagus"].element,
            LANDMARK_Carina_overlay: structures["LANDMARK_Carina"].element,
            LANDMARK_T4T5_overlay: structures["LANDMARK_T4T5"].element,
            // Functions
            clearBeams, // Expose the function
            ensureStructureVisible: (structureId) => {
                if (structures[structureId] && !structures[structureId].visible) {
                    structures[structureId].visible = true;
                    updateStructureVisuals();
                    updateDVH();
                }
            },
            switchPlanningMode, // Expose function
            // Add any other functions the tutorial might need to call or properties to check
        };
    }

    initializeTPS();
});

