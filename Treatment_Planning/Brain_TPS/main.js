/**
 * main.js
 * Main JavaScript for the Whole Brain TPS: POP & Arc Concepts Simulator
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const wfStep1 = document.getElementById('wf-step1');
    const wfStep2 = document.getElementById('wf-step2');
    const wfStep3 = document.getElementById('wf-step3');
    const wfStep4 = document.getElementById('wf-step4');

    const ctSliceSlider = document.getElementById('ctSliceSlider');
    const ctSliceValueText = document.getElementById('ctSliceValueText');
    const ctViewerImage = document.getElementById('ctViewerImage');
    const viewerArea = document.querySelector('.viewer-area');

    const structureSelector = document.getElementById('structureSelector');
    const toggleStructureVisibilityBtn = document.getElementById('toggleStructureVisibilityBtn');
    const editStructureBtn = document.getElementById('editStructureBtn');
    const structureEditorDiv = document.getElementById('structureEditor');
    const editingStructureNameSpan = document.getElementById('editingStructureName');
    const structureSliders = document.querySelectorAll('.structure-slider');

    const tabForwardPlanning = document.getElementById('tabForwardPlanning');
    const tabInversePlanning = document.getElementById('tabInversePlanning');
    const forwardPlanningTabContent = document.getElementById('forwardPlanningTabContent');
    const inversePlanningTabContent = document.getElementById('inversePlanningTabContent');
    const planTypeText = document.getElementById('planTypeText');

    const gantryAngleInput = document.getElementById('gantryAngle');
    const fieldSizeXInput = document.getElementById('fieldSizeX');
    const fieldSizeYInput = document.getElementById('fieldSizeY');
    const beamWeightInput = document.getElementById('beamWeight');
    const addBeamBtn = document.getElementById('addBeamBtn');
    const applyBeamSettingsBtn = document.getElementById('applyBeamSettingsBtn');
    const clearBeamsBtn = document.getElementById('clearBeamsBtn');

    // Inverse Planning Inputs for Whole Brain
    const ptvD95WbInput = document.getElementById('ptvD95_wb');
    const lensMaxWbInput = document.getElementById('lensMax_wb');
    const eyeMaxWbInput = document.getElementById('eyeMax_wb');
    const brainstemMaxWbInput = document.getElementById('brainstemMax_wb');
    const chiasmMaxWbInput = document.getElementById('chiasmMax_wb');
    const simulateImrtBtn = document.getElementById('simulateImrtBtn'); // Reused for Arc simulation

    const beamListDiv = document.getElementById('beamList');
    const bevPlaceholderDiv = document.getElementById('bevPlaceholder');
    const dvhChartCanvas = document.getElementById('dvhChartCanvas').getContext('2d');
    const isodoseOverlaySVG = document.getElementById('isodoseOverlaySVG');
    const approvePlanBtn = document.getElementById('approvePlanBtn');

    // Plan Summary Spans for Whole Brain
    const summaryPtvD95Wb = document.getElementById('summary_PTV_D95_wb');
    const summaryLensMaxWb = document.getElementById('summary_Lens_Max_wb');
    const summaryEyeMaxWb = document.getElementById('summary_Eye_Max_wb');
    const summaryChiasmMaxWb = document.getElementById('summary_Chiasm_Max_wb');
    const summaryBrainstemMaxWb = document.getElementById('summary_Brainstem_Max_wb');

    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // --- Application State ---
    let currentPlanningMode = 'forward'; // 'forward' or 'inverse'
    let beams = [];
    let selectedBeamIndex = -1;
    let currentEditingStructureId = null;
    let ctSliceImagePaths = [];

    // Structure data for Whole Brain
    const structures = {
        "PTV_WholeBrain":   { id: "PTV_WholeBrain", element: document.getElementById('PTV_WholeBrain_overlay'), visible: true, name: "PTV Whole Brain", type: "PTV", color: 'rgba(253, 224, 71, 0.3)', borderColor: '#fde047', x: 15, y: 10, w: 70, h: 80, shapeParams: { borderRadius: '45% 45% 35% 35% / 50% 50% 40% 40%' } },
        "OAR_Eye_L":        { id: "OAR_Eye_L", element: document.getElementById('OAR_Eye_L_overlay'), visible: true, name: "Eye Left", type: "OAR", color: 'rgba(59, 130, 246, 0.4)', borderColor: '#3b82f6', x: 25, y: 38, w: 10, h: 8, shapeParams: { borderRadius: '50%' } },
        "OAR_Eye_R":        { id: "OAR_Eye_R", element: document.getElementById('OAR_Eye_R_overlay'), visible: true, name: "Eye Right", type: "OAR", color: 'rgba(59, 130, 246, 0.4)', borderColor: '#3b82f6', x: 65, y: 38, w: 10, h: 8, shapeParams: { borderRadius: '50%' } },
        "OAR_Lens_L":       { id: "OAR_Lens_L", element: document.getElementById('OAR_Lens_L_overlay'), visible: true, name: "Lens Left", type: "OAR", color: 'rgba(16, 185, 129, 0.5)', borderColor: '#10b981', x: 27, y: 40, w: 4, h: 3, shapeParams: { borderRadius: '50%' } },
        "OAR_Lens_R":       { id: "OAR_Lens_R", element: document.getElementById('OAR_Lens_R_overlay'), visible: true, name: "Lens Right", type: "OAR", color: 'rgba(16, 185, 129, 0.5)', borderColor: '#10b981', x: 69, y: 40, w: 4, h: 3, shapeParams: { borderRadius: '50%' } },
        "OAR_OpticNerve_L": { id: "OAR_OpticNerve_L", element: document.getElementById('OAR_OpticNerve_L_overlay'), visible: true, name: "Optic Nerve L", type: "OAR", color: 'rgba(236, 72, 153, 0.4)', borderColor: '#ec4899', x: 35, y: 42, w: 10, h: 3, shapeParams: { borderRadius: '3px', transform: 'rotate(-10deg)' } },
        "OAR_OpticNerve_R": { id: "OAR_OpticNerve_R", element: document.getElementById('OAR_OpticNerve_R_overlay'), visible: true, name: "Optic Nerve R", type: "OAR", color: 'rgba(236, 72, 153, 0.4)', borderColor: '#ec4899', x: 55, y: 42, w: 10, h: 3, shapeParams: { borderRadius: '3px', transform: 'rotate(10deg)' } },
        "OAR_OpticChiasm":  { id: "OAR_OpticChiasm", element: document.getElementById('OAR_OpticChiasm_overlay'), visible: true, name: "Optic Chiasm", type: "OAR", color: 'rgba(240, 82, 82, 0.4)', borderColor: '#f05252', x: 46, y: 46, w: 8, h: 4, shapeParams: { borderRadius: '20%' } },
        "OAR_Brainstem":    { id: "OAR_Brainstem", element: document.getElementById('OAR_Brainstem_overlay'), visible: true, name: "Brainstem", type: "OAR", color: 'rgba(239, 68, 68, 0.5)', borderColor: '#ef4444', x: 45, y: 55, w: 10, h: 25, shapeParams: { borderRadius: '10px 10px 25px 25px' } }
    };
    // Store original structure definitions for reset or different patient scenarios
    const originalStructures = JSON.parse(JSON.stringify(structures));


    const dvhChart = new Chart(dvhChartCanvas, { /* ... DVH chart options same as lung ... */
        type: 'line',
        data: {
            labels: Array.from({ length: 101 }, (_, i) => i.toString()), // Dose 0-100 Gy
            datasets: []
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

    function updateWorkflowStep(stepElement, isComplete = true) {
        if (stepElement) {
            if (isComplete) stepElement.classList.add('workflow-step-done');
            else stepElement.classList.remove('workflow-step-done');
        }
    }

    function populateCtSliceImages() {
        ctSliceImagePaths = Array.from({ length: 50 }, (_, i) => `https://placehold.co/600x500/111827/4b5563?text=Brain+Slice+${i + 1}`);
        ctViewerImage.src = ctSliceImagePaths[parseInt(ctSliceSlider.value) - 1];
    }
    ctSliceSlider.addEventListener('input', () => {
        const sliceNum = parseInt(ctSliceSlider.value);
        ctSliceValueText.textContent = sliceNum;
        if (ctSliceImagePaths[sliceNum - 1]) {
            ctViewerImage.src = ctSliceImagePaths[sliceNum - 1];
        }
        Object.values(structures).forEach(s => {
            if (s.element) { // Simple bobbing effect for all structures
                s.element.style.transform = `translateY(${(sliceNum - 25) * 0.05}%) ${s.shapeParams?.transform || ''}`;
            }
        });
        drawSimulatedIsodose();
        updateWorkflowStep(wfStep1);
    });

    function updateStructureVisuals() {
        Object.values(structures).forEach(s => {
            if (s.element) {
                s.element.style.display = s.visible ? 'flex' : 'none'; // Use flex for centering text
                s.element.style.left = `${s.x}%`;
                s.element.style.top = `${s.y}%`;
                s.element.style.width = `${s.w}%`;
                s.element.style.height = `${s.h}%`;
                s.element.style.backgroundColor = s.color;
                s.element.style.borderColor = s.borderColor;
                if (s.shapeParams) {
                    if (s.shapeParams.borderRadius) s.element.style.borderRadius = s.shapeParams.borderRadius;
                    if (s.shapeParams.transform) s.element.style.transform = s.shapeParams.transform;
                }
            }
        });
    }

    toggleStructureVisibilityBtn.addEventListener('click', () => {
        const selectedId = structureSelector.value;
        if (structures[selectedId]) {
            structures[selectedId].visible = !structures[selectedId].visible;
            updateStructureVisuals();
            updateDVH();
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

    function switchPlanningMode(mode) {
        currentPlanningMode = mode;
        if (mode === 'forward') {
            tabForwardPlanning.classList.add('active');
            tabInversePlanning.classList.remove('active');
            forwardPlanningTabContent.classList.remove('hidden');
            inversePlanningTabContent.classList.add('hidden');
            planTypeText.textContent = "Current Mode: Forward Planning (POP)";
        } else { // inverse (Arc Concept)
            tabForwardPlanning.classList.remove('active');
            tabInversePlanning.classList.add('active');
            forwardPlanningTabContent.classList.add('hidden');
            inversePlanningTabContent.classList.remove('hidden');
            planTypeText.textContent = "Current Mode: Inverse Planning (Arc Concept)";
        }
        clearBeams(); // Clear beams when switching modes for simplicity
        updateDVH();
        drawSimulatedIsodose();
        updateBeamListDisplay();
        updateWorkflowStep(wfStep3);
    }
    tabForwardPlanning.addEventListener('click', () => switchPlanningMode('forward'));
    tabInversePlanning.addEventListener('click', () => switchPlanningMode('inverse'));

    // --- Beam Management (mostly same as lung, adapted for WBRT defaults) ---
    function createBeamVisualElement(beam, index) { /* ... same as lung ... */
        const beamDiv = document.createElement('div');
        beamDiv.classList.add('beam-icon');
        beamDiv.innerHTML = '&#9650;';
        beamDiv.style.color = (index === selectedBeamIndex) ? '#FFD700' : '#38bdf8'; // Light blue for brain beams
        beamDiv.style.transform = `translate(-50%, -100%) rotate(${beam.angle}deg)`;

        const viewerWidth = viewerArea.offsetWidth;
        const viewerHeight = viewerArea.offsetHeight;
        const radius = Math.min(viewerWidth, viewerHeight) * 0.48;
        const radAngle = (beam.angle - 90) * Math.PI / 180;
        const beamX = viewerWidth / 2 + radius * Math.cos(radAngle);
        const beamY = viewerHeight / 2 + radius * Math.sin(radAngle);
        beamDiv.style.left = `${beamX}px`;
        beamDiv.style.top = `${beamY}px`;
        viewerArea.appendChild(beamDiv);

        const beamLine = document.createElement('div');
        beamLine.classList.add('beam-line');
        const lineLength = radius * 0.85;
        beamLine.style.width = `${lineLength}px`;
        beamLine.style.height = '3px';
        beamLine.style.backgroundColor = (index === selectedBeamIndex) ? 'rgba(255, 215, 0, 0.7)' : 'rgba(56, 189, 248, 0.5)';
        beamLine.style.opacity = 0.4 + (beam.weight / 100 * 0.6);
        beamLine.style.left = `${beamX}px`;
        beamLine.style.top = `${beamY}px`;
        beamLine.style.transformOrigin = `0% 50%`;
        beamLine.style.transform = `rotate(${beam.angle}deg)`;
        viewerArea.appendChild(beamLine);

        beamDiv.addEventListener('click', () => selectBeam(index));
        return { icon: beamDiv, line: beamLine };
    }

    function renderForwardBeams() { /* ... same as lung ... */
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
    function updateBeamListDisplay() { /* ... same as lung, but text for Inverse mode changes to "Arc Plan Active" ... */
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
        } else if (currentPlanningMode === 'inverse' && beams.length > 0) {
             beamListDiv.innerHTML = `<div class="p-1 bg-slate-100 rounded text-center">Simulated Arc Plan Active (${beams.length} conceptual control points)</div>`;
             bevPlaceholderDiv.textContent = "Arc Plan: Gantry Rotating";
        } else {
            beamListDiv.innerHTML = '<div class="p-1 text-slate-400 text-center">No beams defined.</div>';
            bevPlaceholderDiv.textContent = "Conceptual BEV";
        }
    }
    function selectBeam(index) { /* ... same as lung ... */
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
    addBeamBtn.addEventListener('click', () => { /* ... same as lung ... */
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
    applyBeamSettingsBtn.addEventListener('click', () => { /* ... same as lung ... */
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
    function clearBeams() { /* ... same as lung ... */
        beams = [];
        selectedBeamIndex = -1;
        if (currentPlanningMode === 'forward') {
            renderForwardBeams();
        } else {
            updateBeamListDisplay();
            updateDVH();
            drawSimulatedIsodose();
        }
    }
    clearBeamsBtn.addEventListener('click', clearBeams);

    // --- Inverse Planning (Arc Simulation for WBRT) ---
    simulateImrtBtn.addEventListener('click', () => {
        if (currentPlanningMode !== 'inverse') return;
        beams = []; // Clear any previous
        const numArcSegments = 12; // Simulate an arc with multiple segments/control points
        for (let i = 0; i < numArcSegments; i++) {
            beams.push({ // Conceptual segments, field size might modulate in a real arc
                angle: Math.round((360 / numArcSegments) * i),
                sizeX: parseFloat(fieldSizeXInput.value) || 16, // Use current FS as a base or default
                sizeY: parseFloat(fieldSizeYInput.value) || 20,
                weight: Math.round(100 / numArcSegments + Math.random() * 10 - 5) // Distribute weight
            });
        }
        updateDVH(true); // Pass flag for inverse/arc simulation
        drawSimulatedIsodose();
        updateBeamListDisplay();
        updateWorkflowStep(wfStep3);
        if (typeof alert !== 'undefined') alert('Arc plan optimization simulated! Check DVH and Plan Summary.');
        else console.log('Arc plan optimization simulated! Check DVH and Plan Summary.');
    });

    // --- DVH Calculation (Conceptual, adapted for WBRT) ---
    function calculateDVHPoint(baseVolume, dose, targetScore, oarSensitivity, isPTV, oarMaxConstraint = 100) {
        let volume = baseVolume;
        if (isPTV) { // PTV Whole Brain: Aim for homogeneous dose
            const targetDose = targetScore; // targetScore is D95%
            if (dose < targetDose * 0.98) volume = 100; // High volume up to near targetDose
            else if (dose < targetDose * 1.07) volume = Math.max(2, 100 - (dose - targetDose * 0.98) * (98 / (targetDose * 0.09 + 1))); // Steeper fall-off
            else volume = Math.max(0, 2 - (dose - targetDose * 1.07) * 0.5);
        } else { // OARs for WBRT
            const toleranceDose = Math.min(oarMaxConstraint, 100 - oarSensitivity);
            if (dose < toleranceDose * 0.5) volume = Math.max(0, 80 - oarSensitivity * 0.5); // Some volume might get low dose
            else if (dose < toleranceDose) volume = Math.max(0, (80 - oarSensitivity*0.5) - (dose - toleranceDose*0.5) * ( (80 - oarSensitivity*0.5) / (toleranceDose*0.5 +1) ) );
            else volume = 0; // Aim for sharp fall-off beyond tolerance
        }
        return Math.max(0, Math.min(100, volume));
    }

    function updateDVH(isArcSim = false) {
        const datasets = [];
        const doseValues = Array.from({ length: 101 }, (_, i) => i);

        const ptv = structures["PTV_WholeBrain"];
        if (ptv && ptv.visible) {
            let ptvTargetScore = 0;
            if (currentPlanningMode === 'forward' && beams.length > 0) {
                let totalWeightEffect = 0;
                beams.forEach(b => { totalWeightEffect += b.weight; });
                ptvTargetScore = Math.min(95, 15 + totalWeightEffect / beams.length * 0.7); // WBRT POP is quite homogeneous
                 if (beams.length === 2 && ( (beams[0].angle === 90 && beams[1].angle === 270) || (beams[0].angle === 270 && beams[1].angle === 90) ) ) {
                    ptvTargetScore = Math.min(95, 25 + totalWeightEffect / beams.length * 0.6); // POP gives good coverage
                }
            } else if (currentPlanningMode === 'inverse') { // Arc
                ptvTargetScore = parseFloat(ptvD95WbInput.value) || 30;
                if (isArcSim) ptvTargetScore *= 1.01; // Arc might be slightly better than objective
            }
            ptvTargetScore = Math.max(10, ptvTargetScore); // Ensure some dose

            datasets.push({
                label: ptv.name,
                data: doseValues.map(dose => calculateDVHPoint(100, dose, ptvTargetScore, 0, true)),
                borderColor: ptv.borderColor, backgroundColor: ptv.color, fill: true, tension: 0.1,
                pointRadius: 0, borderWidth: 1.5
            });
        }

        Object.values(structures).forEach(s => {
            if (s.type === "OAR" && s.visible) {
                let oarSensitivityScore = 30; // Base sensitivity
                let oarMaxConstraint = 100; // Default no strict max from objectives

                if (s.id.includes("Lens")) oarSensitivityScore = 85; // Lenses are very sensitive
                else if (s.id.includes("Eye")) oarSensitivityScore = 70;
                else if (s.id.includes("OpticNerve")) oarSensitivityScore = 50;
                else if (s.id === "OAR_OpticChiasm") oarSensitivityScore = 50;
                else if (s.id === "OAR_Brainstem") oarSensitivityScore = 40;

                if (currentPlanningMode === 'inverse' && isArcSim) { // Arc can spare more
                    oarSensitivityScore *= 1.15; // Effectively lower dose by making it seem more sensitive to sparing
                    if (s.id.includes("Lens")) oarMaxConstraint = parseFloat(lensMaxWbInput.value) || 7;
                    else if (s.id.includes("Eye")) oarMaxConstraint = parseFloat(eyeMaxWbInput.value) || 15;
                    else if (s.id === "OAR_Brainstem") oarMaxConstraint = parseFloat(brainstemMaxWbInput.value) || 30;
                    else if (s.id === "OAR_OpticChiasm") oarMaxConstraint = parseFloat(chiasmMaxWbInput.value) || 30;
                } else if (currentPlanningMode === 'forward' && beams.length === 2) { // POP WBRT
                     // For POP, OARs get significant dose, so lower sensitivity score for DVH curve
                    if (s.id.includes("Lens")) oarSensitivityScore = 20;
                    else if (s.id.includes("Eye")) oarSensitivityScore = 15;
                    else oarSensitivityScore = 10;
                }
                oarSensitivityScore = Math.max(5, Math.min(95, oarSensitivityScore));

                datasets.push({
                    label: s.name,
                    data: doseValues.map(dose => calculateDVHPoint(100, dose, 0, oarSensitivityScore, false, oarMaxConstraint)),
                    borderColor: s.borderColor, backgroundColor: 'transparent', fill: false, tension: 0.1,
                    borderDash: [3, 3], pointRadius: 0, borderWidth: 1.5
                });
            }
        });
        dvhChart.data.datasets = datasets;
        dvhChart.update();
        updatePlanSummaryUI_WBRT();
        updateWorkflowStep(wfStep4);
    }

    // --- Isodose Simulation (Conceptual for WBRT) ---
    function drawSimulatedIsodose() {
        isodoseOverlaySVG.innerHTML = '';
        if (beams.length === 0 && currentPlanningMode === 'forward') return;

        const ptv = structures["PTV_WholeBrain"];
        if (!ptv || !ptv.element || !ptv.visible) return;

        const ptvRect = { x: ptv.x, y: ptv.y, w: ptv.w, h: ptv.h };
        const ptvCenterX = ptvRect.x + ptvRect.w / 2;
        const ptvCenterY = ptvRect.y + ptvRect.h / 2;

        let intensityFactor = 1.0; let spreadFactor = 1.0;

        if (currentPlanningMode === 'forward' && beams.length > 0) {
            intensityFactor = beams.reduce((sum, b) => sum + b.weight, 0) / (beams.length * 50 +1); // Avg weight relative to 50
            spreadFactor = 1.0; // POP is broad
        } else if (currentPlanningMode === 'inverse') { // Arc
            intensityFactor = (parseFloat(ptvD95WbInput.value) || 30) / 30.0; // Relative to 30Gy Rx
            spreadFactor = 0.9; // Arc might be slightly more conformal
        }

        const isoColors = { high: '#16a34a', medium: '#facc15', low: '#60a5fa' };

        // High dose (Rx) - covers most of PTV
        createIsodosePath(ptvCenterX, ptvCenterY, ptvRect.w * 0.45 * spreadFactor * intensityFactor, ptvRect.h * 0.45 * spreadFactor * intensityFactor, isoColors.high, 0.5, ptv.shapeParams.borderRadius);
        // Medium dose - slightly larger
        createIsodosePath(ptvCenterX, ptvCenterY, ptvRect.w * 0.55 * spreadFactor * intensityFactor, ptvRect.h * 0.55 * spreadFactor * intensityFactor, isoColors.medium, 0.35, '50%');
        // Low dose - encompasses everything
        createIsodosePath(ptvCenterX, ptvCenterY, ptvRect.w * 0.7 * spreadFactor * intensityFactor, ptvRect.h * 0.7 * spreadFactor * intensityFactor, isoColors.low, 0.2, '50%');
    }
    function createIsodosePath(cx_pct, cy_pct, rx_pct, ry_pct, fillColor, opacity, borderRadius = '50%') { /* ... same as lung ... */
        const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        ellipse.setAttribute("cx", `${Math.max(5,Math.min(95,cx_pct))}%`);
        ellipse.setAttribute("cy", `${Math.max(5,Math.min(95,cy_pct))}%`);
        ellipse.setAttribute("rx", `${Math.max(1,rx_pct)}%`);
        ellipse.setAttribute("ry", `${Math.max(1,ry_pct)}%`);
        ellipse.style.fill = fillColor;
        ellipse.style.opacity = opacity;
        isodoseOverlaySVG.appendChild(ellipse);
    }


    // --- Plan Summary UI Update for WBRT ---
    function getDVHMetric(structureName, doseLevel, isMaxDose = false, isVolumeAtDose = true) { /* ... same as lung ... */
        const dataset = dvhChart.data.datasets.find(ds => ds.label === structureName);
        if (!dataset) return "N/A";
        const doseValues = dvhChart.data.labels.map(l => parseFloat(l));

        if (isMaxDose) {
            for (let i = doseValues.length - 1; i >= 0; i--) {
                if (dataset.data[i] > 0.5) return doseValues[i].toFixed(1) + " Gy"; // Dose at which >0.5% volume exists
            }
            return "<1 Gy";
        } else if (isVolumeAtDose) { // V_doseGy
            const index = doseValues.findIndex(d => d >= doseLevel);
            if (index !== -1) return dataset.data[index].toFixed(1) + "%";
        } else { // D_volume% (e.g. D95%)
            for (let i = 0; i < doseValues.length; i++) {
                if (dataset.data[i] <= doseLevel) return doseValues[i].toFixed(1) + " Gy";
            }
            const lastDose = doseValues[doseValues.length-1];
            return `>${lastDose.toFixed(1)} Gy`;
        }
        return "N/A";
    }

    function updatePlanSummaryUI_WBRT() {
        summaryPtvD95Wb.textContent = getDVHMetric(structures["PTV_WholeBrain"].name, 95, false, false); // D95%
        summaryLensMaxWb.textContent = getDVHMetric(structures["OAR_Lens_L"].name, 0, true) + " (L), " + getDVHMetric(structures["OAR_Lens_R"].name, 0, true) + " (R)";
        summaryEyeMaxWb.textContent = getDVHMetric(structures["OAR_Eye_L"].name, 0, true) + " (L), " + getDVHMetric(structures["OAR_Eye_R"].name, 0, true) + " (R)";
        summaryChiasmMaxWb.textContent = getDVHMetric(structures["OAR_OpticChiasm"].name, 0, true);
        summaryBrainstemMaxWb.textContent = getDVHMetric(structures["OAR_Brainstem"].name, 0, true);

        // Conceptual styling based on objectives (very simplified)
        const ptvD95Val = parseFloat(summaryPtvD95Wb.textContent);
        const ptvObjective = parseFloat(ptvD95WbInput.value) || 30;
        summaryPtvD95Wb.className = `font-semibold ${ptvD95Val >= ptvObjective ? 'text-green-600' : 'text-red-600'}`;

        const lensMaxValL = parseFloat(getDVHMetric(structures["OAR_Lens_L"].name, 0, true));
        const lensObjective = parseFloat(lensMaxWbInput.value) || 7;
        summaryLensMaxWb.className = `font-semibold ${lensMaxValL <= lensObjective ? 'text-green-600' : 'text-red-600'}`;
    }

    approvePlanBtn.addEventListener('click', () => { /* ... same as lung ... */
        if (typeof alert !== 'undefined') alert("Plan Approved! (Conceptual Action)");
        else console.log("Plan Approved! (Conceptual Action)");
    });

    // --- Helper for tutorial: Set visibility for a list of structures ---
    function setStructureVisibility(structureIdArray, isVisible) {
        if (!structures) return;
        structureIdArray.forEach(id => {
            let structureKey = id.replace('_overlay', ''); // Get key from element ID if that's what tutorial passes
            if (structures[structureKey]) {
                structures[structureKey].visible = isVisible;
            } else if (structures[id]) { // If ID passed is already the key
                structures[id].visible = isVisible;
            }
        });
        updateStructureVisuals();
        updateDVH();
    }


    // --- Initialization ---
    function initializeTPS_WBRT() {
        populateCtSliceImages();
        updateStructureVisuals();
        switchPlanningMode('forward'); // Default to forward POP planning
        updateWorkflowStep(wfStep1, true);
        updateWorkflowStep(wfStep2, true);

        // Expose elements and functions for the tutorial via window.tpsContext
        // This should be a generic name if this main.js is intended for multiple anatomy sites.
        window.tpsContext = { // Renamed from lungTpsContext for generality
            // State
            get beams() { return beams; },
            get structures() { return structures; }, // Exposes the live structures object
            get currentPlanningMode() { return currentPlanningMode; },
            // DOM Elements needed by tutorial.js
            gantryAngleInput, fieldSizeXInput, fieldSizeYInput, beamWeightInput, addBeamBtn,
            applyBeamSettingsBtn, beamListDiv, clearBeamsBtn,
            dvhChartCanvas: dvhChartCanvas.canvas,
            isodoseOverlaySVG, planTypeText, bevPlaceholderDiv,
            tabForwardPlanning, tabInversePlanning, simulateImrtBtn, // Tabs and IMRT button

            // WBRT Specific Objective Inputs
            ptvD95Input: ptvD95WbInput,
            lensMaxInput: lensMaxWbInput, // Assuming tutorial might use these specific IDs
            eyeMaxInput: eyeMaxWbInput,
            brainstemMaxInput: brainstemMaxWbInput,
            chiasmMaxInput: chiasmMaxWbInput,
            cordMaxInput: brainstemMaxWbInput, // Tutorial uses cordMaxInput as a placeholder for brainstemMax

            // Structure Overlays (pass the DOM elements)
            PTV_WholeBrain_overlay: structures["PTV_WholeBrain"].element,
            OAR_Eye_L_overlay: structures["OAR_Eye_L"].element,
            OAR_Eye_R_overlay: structures["OAR_Eye_R"].element,
            OAR_Lens_L_overlay: structures["OAR_Lens_L"].element,
            OAR_Lens_R_overlay: structures["OAR_Lens_R"].element,
            OAR_OpticNerve_L_overlay: structures["OAR_OpticNerve_L"].element,
            OAR_OpticNerve_R_overlay: structures["OAR_OpticNerve_R"].element,
            OAR_OpticChiasm_overlay: structures["OAR_OpticChiasm"].element,
            OAR_Brainstem_overlay: structures["OAR_Brainstem"].element,
            
            // Also include Lung structure overlays if this main.js is meant to be multi-purpose
            // For simplicity now, focusing on brain. If multi-purpose, these would also be here.
            PTV_Lung_overlay: document.getElementById('PTV_Lung_overlay'), // Example, if it existed
            LANDMARK_Carina_overlay: document.getElementById('LANDMARK_Carina_overlay'), // Example

            // Summary Spans for WBRT
            summary_PTV_D95_wb: summaryPtvD95Wb,
            summary_Lens_Max_wb: summaryLensMaxWb,
            summary_Eye_Max_wb: summaryEyeMaxWb,
            summary_Chiasm_Max_wb: summaryChiasmMaxWb,
            summary_Brainstem_Max_wb: summaryBrainstemMaxWb,

            // Functions
            clearBeams,
            switchPlanningMode,
            setStructureVisibility, // Expose the new helper function
            ensureStructureVisible: (structureId) => { // Simplified version for tutorial
                let key = structureId.replace('_overlay', '');
                if (structures[key] && !structures[key].visible) {
                    structures[key].visible = true;
                    updateStructureVisuals(); updateDVH();
                } else if (structures[structureId] && !structures[structureId].visible) {
                    structures[structureId].visible = true;
                    updateStructureVisuals(); updateDVH();
                }
            },
        };
    }

    initializeTPS_WBRT();
});
