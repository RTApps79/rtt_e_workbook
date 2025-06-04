document.addEventListener('DOMContentLoaded', () => {
    // --- Existing DOM Elements ---
    const ctSliceInput = document.getElementById('ctSlice');
    const ctSliceValueDisplay = document.getElementById('ctSliceValue');
    const ctViewerImage = document.getElementById('ctViewerImage');
    const viewerArea = document.querySelector('.viewer-area');
    const addBeamBtn = document.getElementById('addBeamBtn');
    const clearBeamsBtn = document.getElementById('clearBeamsBtn');
    const gantryAngleInput = document.getElementById('gantryAngle');
    const fieldSizeXInput = document.getElementById('fieldSizeX');
    const fieldSizeYInput = document.getElementById('fieldSizeY');
    const applyBeamSettingsBtn = document.getElementById('applyBeamSettings');
    const beamList = document.getElementById('beamList');
    const dvhCtx = document.getElementById('dvhChartCanvas').getContext('2d');

    // --- NEW DOM Elements ---
    const beamWeightInput = document.getElementById('beamWeight');
    const structureSelector = document.getElementById('structureSelector');
    const toggleStructureVisibilityBtn = document.getElementById('toggleStructureVisibilityBtn');
    const editStructureBtn = document.getElementById('editStructureBtn');
    const structureEditorDiv = document.getElementById('structureEditor');
    const editingStructureNameSpan = document.getElementById('editingStructureName');
    const structureSliders = document.querySelectorAll('.structure-slider');

    const displayingStructuresText = document.getElementById('displayingStructuresText');
    const isodoseOverlaySVG = document.getElementById('isodoseOverlaySVG');
    const planSummaryPTV = document.getElementById('planSummaryPTV');
    const planSummaryOAR = document.getElementById('planSummaryOAR');
    const planSummaryComplexity = document.getElementById('planSummaryComplexity');
    const bevPlaceholder = document.getElementById('bevPlaceholder');
    const optimizePlanBtn = document.getElementById('optimizePlanBtn');
    const approvePlanBtn = document.getElementById('approvePlanBtn');


    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // --- Workflow Step Indicators ---
    const wfIndicators = {
        step1: document.getElementById('wf-step1'),
        step2: document.getElementById('wf-step2'),
        step3: document.getElementById('wf-step3'),
        step4: document.getElementById('wf-step4'),
        step5: document.getElementById('wf-step5'),
    };

    function updateWorkflowStep(stepKey, isComplete = true) {
        if (wfIndicators[stepKey]) {
            if (isComplete) {
                wfIndicators[stepKey].classList.add('workflow-step-done');
            } else {
                wfIndicators[stepKey].classList.remove('workflow-step-done');
            }
        }
    }
    updateWorkflowStep('step1'); // Step 1 considered done on load

    // --- Structure Data & Management ---
    const structures = { // Store initial % positions and sizes relative to viewerArea
        "PTV_Prostate": { element: document.getElementById('PTV_Prostate_overlay'), visible: true, color: 'rgba(245, 158, 11, 0.3)', borderColor: '#f59e0b', name: "PTV Prostate", type: "PTV",
                            x: 45, y: 40, w: 10, h: 20, shape: 'ellipse' },
        "OAR_Rectum":   { element: document.getElementById('OAR_Rectum_overlay'), visible: true, color: 'rgba(239, 68, 68, 0.4)', borderColor: '#ef4444', name: "Rectum", type: "OAR",
                            x: 40, y: 60, w: 20, h: 15, shape: 'custom', borderRadius: '15px 35% 35% 15px'},
        "OAR_Bladder":  { element: document.getElementById('OAR_Bladder_overlay'), visible: true, color: 'rgba(59, 130, 246, 0.4)', borderColor: '#3b82f6', name: "Bladder", type: "OAR",
                            x: 48, y: 25, w: 15, h: 12, shape: 'custom', borderRadius: '40% 40% 15px 15px'},
        "OAR_FemHead_L":{ element: document.getElementById('OAR_FemHead_L_overlay'), visible: true, color: 'rgba(168, 85, 247, 0.4)', borderColor: '#a855f7', name: "L Femoral Head", type: "OAR",
                            x: 25, y: 42, w: 10, h: 18, shape: 'ellipse'},
        "OAR_FemHead_R":{ element: document.getElementById('OAR_FemHead_R_overlay'), visible: true, color: 'rgba(168, 85, 247, 0.4)', borderColor: '#a855f7', name: "R Femoral Head", type: "OAR",
                            x: 65, y: 42, w: 10, h: 18, shape: 'ellipse'}
    };
    let currentEditingStructureId = null;

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
                if (s.shape === 'ellipse') s.element.style.borderRadius = '50%';
                else if (s.shape === 'custom' && s.borderRadius) s.element.style.borderRadius = s.borderRadius;
            }
        });
        const visibleNames = Object.keys(structures).filter(id => structures[id].visible).map(id => structures[id].name.split(" ")[0]).join(', ');
        displayingStructuresText.textContent = visibleNames || "None";
    }
    updateStructureVisuals(); // Initial call

    toggleStructureVisibilityBtn.addEventListener('click', () => {
        const selectedId = structureSelector.value;
        if (structures[selectedId]) {
            structures[selectedId].visible = !structures[selectedId].visible;
            updateStructureVisuals();
            updateWorkflowStep('step2');
            updateDVH(); // OAR visibility might affect DVH conceptually
        }
    });

    editStructureBtn.addEventListener('click', () => {
        currentEditingStructureId = structureSelector.value;
        if (structures[currentEditingStructureId]) {
            structureEditorDiv.classList.remove('hidden');
            editingStructureNameSpan.textContent = structures[currentEditingStructureId].name;
            document.getElementById('structureSizeX').value = structures[currentEditingStructureId].w;
            document.getElementById('structureSizeY').value = structures[currentEditingStructureId].h;
            document.getElementById('structurePosX').value = structures[currentEditingStructureId].x;
            document.getElementById('structurePosY').value = structures[currentEditingStructureId].y;
            document.getElementById('structureSizeXValue').textContent = structures[currentEditingStructureId].w;
            document.getElementById('structureSizeYValue').textContent = structures[currentEditingStructureId].h;
            document.getElementById('structurePosXValue').textContent = structures[currentEditingStructureId].x;
            document.getElementById('structurePosYValue').textContent = structures[currentEditingStructureId].y;

        } else {
            structureEditorDiv.classList.add('hidden');
            currentEditingStructureId = null;
        }
    });
    structureSliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            if (currentEditingStructureId && structures[currentEditingStructureId]) {
                const val = e.target.value;
                document.getElementById(e.target.id + 'Value').textContent = val;
                if (e.target.id === 'structureSizeX') structures[currentEditingStructureId].w = parseInt(val);
                if (e.target.id === 'structureSizeY') structures[currentEditingStructureId].h = parseInt(val);
                if (e.target.id === 'structurePosX') structures[currentEditingStructureId].x = parseInt(val);
                if (e.target.id === 'structurePosY') structures[currentEditingStructureId].y = parseInt(val);
                updateStructureVisuals();
                updateDVH(); // Structure changes affect dose
                drawSimulatedIsodose();
            }
        });
    });


    // --- Beams Data ---
    let beams = [];
    let selectedBeamIndex = -1;

    // --- DVH Chart Initialization ---
    const doseData = Array.from({ length: 101 }, (_, i) => i); // 0 to 100 Gy (conceptual units)
    const dvhChart = new Chart(dvhCtx, {
        type: 'line',
        data: {
            labels: doseData.map(d => d.toString()),
            datasets: [] // Will be populated by updateDVH
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Conceptual Dose (Gy)', color: '#333' }, grid: { color: '#e2e8f0' } },
                y: { title: { display: true, text: 'Volume (%)', color: '#333' }, beginAtZero: true, max: 100, grid: { color: '#e2e8f0' } }
            },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { callbacks: { label: (context) => `Volume: ${context.parsed.y.toFixed(1)}% at ${context.parsed.x} Gy` } }
            }
        }
    });

    // --- CT Slice Viewer (Existing logic modified slightly for workflow) ---
    ctSliceInput.addEventListener('input', (e) => {
        const sliceNum = e.target.value;
        ctSliceValueDisplay.textContent = sliceNum;
        const images = ["image_5f6eda.jpg", "image_5f6e76.jpg", "https://via.placeholder.com/600x400?text=CT+Slice+" + sliceNum];
        ctViewerImage.src = images[sliceNum % images.length];
        // Conceptually, structure positions/shapes might change with slice. For simplicity, keep them static on this view.
        // Update overlays based on slice (conceptual)
        Object.values(structures).forEach(s => {
            if (s.element) { // Simple bobbing effect
                 s.element.style.transform = `translateY(${(sliceNum - 50) * 0.05}%)`;
            }
        });
        drawSimulatedIsodose(); // Isodoses are slice-specific
        updateWorkflowStep('step1');
    });

    // --- Beam Placement Logic (Modified to include weight) ---
    function createBeamElement(angle, sizeX, sizeY, weight) {
        const beamDiv = document.createElement('div');
        beamDiv.classList.add('beam-icon');
        beamDiv.innerHTML = '&#9650;'; // Up arrow icon
        beamDiv.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`; // Position arrow tip
        beamDiv.dataset.gantryAngle = angle;
        beamDiv.dataset.fieldSizeX = sizeX;
        beamDiv.dataset.fieldSizeY = sizeY;
        beamDiv.dataset.weight = weight;

        // Position beam icon around a conceptual isocenter (center of viewer)
        const viewerWidth = viewerArea.offsetWidth;
        const viewerHeight = viewerArea.offsetHeight;
        const radius = Math.min(viewerWidth, viewerHeight) * 0.45; // Distance from center
        const radAngle = (angle - 90) * Math.PI / 180; // Adjust for 0deg top
        const beamX = viewerWidth / 2 + radius * Math.cos(radAngle);
        const beamY = viewerHeight / 2 + radius * Math.sin(radAngle);
        beamDiv.style.left = `${beamX}px`;
        beamDiv.style.top = `${beamY}px`;

        viewerArea.appendChild(beamDiv);

        const beamLine = document.createElement('div');
        beamLine.classList.add('beam-line');
        // Line originates from beam icon towards center. Length dynamically set.
        const lineLength = radius * 0.8; // Make line go towards center but not all the way
        beamLine.style.width = `${lineLength}px`;
        beamLine.style.height = '3px'; // Make it thicker
        // Position and rotate line
        beamLine.style.left = `${beamX}px`;
        beamLine.style.top = `${beamY}px`;
        beamLine.style.transformOrigin = `0% 50%`; // Rotate around the beam icon's point
        beamLine.style.transform = `rotate(${angle}deg)`;
        viewerArea.appendChild(beamLine);

        beamDiv.beamLine = beamLine;
        return beamDiv;
    }

    function updateBeamVisual(beamDiv, angle, sizeX, sizeY, weight) {
        beamDiv.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
        beamDiv.dataset.gantryAngle = angle;
        beamDiv.dataset.fieldSizeX = sizeX;
        beamDiv.dataset.fieldSizeY = sizeY;
        beamDiv.dataset.weight = weight;

        const viewerWidth = viewerArea.offsetWidth;
        const viewerHeight = viewerArea.offsetHeight;
        const radius = Math.min(viewerWidth, viewerHeight) * 0.45;
        const radAngle = (angle - 90) * Math.PI / 180;
        const beamX = viewerWidth / 2 + radius * Math.cos(radAngle);
        const beamY = viewerHeight / 2 + radius * Math.sin(radAngle);
        beamDiv.style.left = `${beamX}px`;
        beamDiv.style.top = `${beamY}px`;

        // Update beam line
        beamDiv.beamLine.style.left = `${beamX}px`;
        beamDiv.beamLine.style.top = `${beamY}px`;
        beamDiv.beamLine.style.transform = `rotate(${angle}deg)`;
        // Conceptually, field size could affect line thickness or a visual cone
        beamDiv.beamLine.style.opacity = 0.3 + (weight / 100 * 0.7);
    }


    function renderBeams() {
        viewerArea.querySelectorAll('.beam-icon, .beam-line').forEach(el => el.remove());
        beams.forEach((beam, index) => {
            const beamDiv = createBeamElement(beam.angle, beam.sizeX, beam.sizeY, beam.weight);
            beamDiv.addEventListener('click', () => selectBeam(index));
            if (index === selectedBeamIndex) {
                beamDiv.style.color = '#FFD700'; // Gold for selected beam
                beamDiv.beamLine.style.backgroundColor = 'rgba(255, 215, 0, 0.7)';
                bevPlaceholder.textContent = `BEV: Target from ${beam.angle}°`;
            } else {
                 beamDiv.style.color = '#4CAF50';
                 beamDiv.beamLine.style.backgroundColor = 'rgba(76, 175, 80, 0.5)';
            }
        });
        updateBeamList();
        updateDVH();
        drawSimulatedIsodose();
        updateWorkflowStep('step3');
    }

    function updateBeamList() {
        beamList.innerHTML = '';
        beams.forEach((beam, index) => {
            const item = document.createElement('div');
            item.classList.add('flex', 'justify-between', 'items-center', 'p-2', 'rounded', 'mb-1', 'cursor-pointer', index === selectedBeamIndex ? 'bg-blue-200' : 'bg-slate-100');
            item.innerHTML = `<span>B${index + 1} (G:${beam.angle}°, FS:${beam.sizeX}x${beam.sizeY}, W:${beam.weight})</span>
                              <button class="text-red-500 text-xs delete-beam hover:font-bold" data-index="${index}">X</button>`;
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-beam')) selectBeam(index);
            });
            beamList.appendChild(item);
        });
        beamList.querySelectorAll('.delete-beam').forEach(btn => {
            btn.addEventListener('click', (e) => {
                beams.splice(parseInt(e.target.dataset.index), 1);
                if (selectedBeamIndex >= beams.length) selectedBeamIndex = beams.length - 1;
                 else if (selectedBeamIndex > parseInt(e.target.dataset.index)) selectedBeamIndex--; // Adjust if an earlier beam deleted
                else if (selectedBeamIndex === parseInt(e.target.dataset.index)) selectedBeamIndex = -1; // Deselect if deleted
                renderBeams();
            });
        });
    }

    function selectBeam(index) {
        selectedBeamIndex = index;
        const beam = beams[index];
        if (beam) {
            gantryAngleInput.value = beam.angle;
            fieldSizeXInput.value = beam.sizeX;
            fieldSizeYInput.value = beam.sizeY;
            beamWeightInput.value = beam.weight;
        }
        renderBeams(); // Re-render to highlight and update BEV
    }

    addBeamBtn.addEventListener('click', () => {
        beams.push({
            angle: parseInt(gantryAngleInput.value),
            sizeX: parseInt(fieldSizeXInput.value),
            sizeY: parseInt(fieldSizeYInput.value),
            weight: parseInt(beamWeightInput.value)
        });
        selectedBeamIndex = beams.length - 1;
        renderBeams();
    });

    clearBeamsBtn.addEventListener('click', () => {
        beams = []; selectedBeamIndex = -1; renderBeams();
        bevPlaceholder.textContent = "Conceptual BEV";
    });

    applyBeamSettingsBtn.addEventListener('click', () => {
        if (selectedBeamIndex !== -1 && beams[selectedBeamIndex]) {
            beams[selectedBeamIndex].angle = parseInt(gantryAngleInput.value);
            beams[selectedBeamIndex].sizeX = parseInt(fieldSizeXInput.value);
            beams[selectedBeamIndex].sizeY = parseInt(fieldSizeYInput.value);
            beams[selectedBeamIndex].weight = parseInt(beamWeightInput.value);
            renderBeams();
        } else { alert('Please select a beam to apply settings.'); }
    });

    // --- Conceptual DVH Update ---
    function updateDVH() {
        const datasets = [];
        const ptv = structures["PTV_Prostate"];

        // PTV Dataset
        if (ptv && ptv.visible) {
            let ptvCoverageScore = 0; // Score from 0 to 100
            beams.forEach(beam => {
                // Conceptual: score based on weight and field size hitting general PTV area
                const fieldArea = beam.sizeX * beam.sizeY;
                ptvCoverageScore += beam.weight * (fieldArea / 400); // Max field 20x20=400
            });
            ptvCoverageScore = Math.min(100, beams.length > 0 ? 20 + ptvCoverageScore / beams.length * 2 : 0); // Average and scale

            datasets.push({
                label: `PTV (${ptv.name})`,
                data: doseData.map(dose => {
                    let vol = 100;
                    // Simulate DVH curve based on coverage score
                    if (dose < ptvCoverageScore * 0.8) vol = 100; // Ideal coverage up to 80% of score
                    else if (dose < ptvCoverageScore * 1.1) vol = Math.max(10, 100 - (dose - ptvCoverageScore * 0.8) * (90 / (ptvCoverageScore * 0.3 + 1)));
                    else vol = Math.max(0, 10 - (dose - ptvCoverageScore * 1.1) * 0.5);
                    return Math.max(0, Math.min(100, vol));
                }),
                borderColor: ptv.borderColor, backgroundColor: ptv.color, fill: true, tension: 0.3
            });
        }

        // OAR Datasets
        Object.keys(structures).forEach(id => {
            const s = structures[id];
            if (s.type === "OAR" && s.visible) {
                let oarDoseScore = 0; // Score 0 to 100 (higher = more dose)
                 beams.forEach(beam => {
                    // Conceptual: if beam angle "points towards" OAR relative to PTV, it gets dose
                    // This is highly simplified. A real calc uses geometry.
                    // Example: Rectum is posterior to PTV (45,40). Beams from 120-240 might hit it.
                    if (id === "OAR_Rectum" && beam.angle > 120 && beam.angle < 240) oarDoseScore += beam.weight * 0.5;
                    else if (id === "OAR_Bladder" && (beam.angle < 60 || beam.angle > 300)) oarDoseScore += beam.weight * 0.4;
                    else if (id.includes("FemHead")) { // Femoral heads are lateral
                        if ( (beam.angle > 60 && beam.angle < 120) || (beam.angle > 240 && beam.angle < 300)) oarDoseScore += beam.weight * 0.3;
                    }
                });
                oarDoseScore = Math.min(100, beams.length > 0 ? oarDoseScore / beams.length * 1.5 : 0);

                datasets.push({
                    label: `${s.name}`,
                    data: doseData.map(dose => {
                        let vol = 100;
                        // Simulate OAR sparing: lower dose for longer
                        if (dose < 20 - oarDoseScore * 0.15) vol = 90 - oarDoseScore * 0.5; // Volume at low dose
                        else if (dose < 50 - oarDoseScore * 0.2) vol = Math.max(0, (90 - oarDoseScore*0.5) - (dose - (20 - oarDoseScore*0.15)) * 2);
                        else vol = 0;
                        return Math.max(0, Math.min(100, vol));
                    }),
                    borderColor: s.borderColor, backgroundColor: s.color, fill: false, tension: 0.3, borderDash: [5, 5]
                });
            }
        });

        dvhChart.data.datasets = datasets;
        dvhChart.update();
        updatePlanSummaryUIText();
        updateWorkflowStep('step4');
    }

    // --- Simulated Isodose Lines ---
    function drawSimulatedIsodose() {
        isodoseOverlaySVG.innerHTML = ''; // Clear previous
        if (beams.length === 0) return;

        const viewerRect = viewerArea.getBoundingClientRect();
        const ptv = structures["PTV_Prostate"];
        if (!ptv || !ptv.element) return;

        const ptvCenterX = ptv.x + ptv.w / 2; // Assumes ptv x,y,w,h are %
        const ptvCenterY = ptv.y + ptv.h / 2;

        // Calculate a composite effect of beams
        let totalWeight = 0; let avgFS = 0; let xMoment = 0; let yMoment = 0;
        beams.forEach(b => {
            totalWeight += b.weight;
            avgFS += (b.sizeX + b.sizeY) / 2;
            const rad = (b.angle - 90) * Math.PI / 180;
            xMoment += Math.cos(rad) * b.weight; // Weighted direction
            yMoment += Math.sin(rad) * b.weight;
        });
        const numBeams = beams.length;
        if (numBeams > 0) { avgFS /= numBeams; totalWeight /= numBeams; }
        else { totalWeight = 50; avgFS = 10;} // Default if no beams

        const doseSpreadFactor = Math.max(0.5, avgFS / 10); // Larger fields spread more
        const beamCoverageFactor = Math.min(1.5, Math.max(0.5, totalWeight / 50 * (numBeams / 2.5)));

        // Shift isocenter slightly based on beam imbalance
        const shiftX = (xMoment / (totalWeight * numBeams +1)) * 5; // % shift
        const shiftY = (yMoment / (totalWeight * numBeams +1)) * 5; // % shift

        const isoColors = {
            high: 'rgba(76, 175, 80, 0.7)',   // Green
            medium: 'rgba(253, 224, 71, 0.6)', // Yellow
            low: 'rgba(100, 116, 139, 0.5)'    // Slate
        };

        // High dose (95% Rx) - tight around PTV, scaled by beam coverage
        createIsodoseEllipse(ptvCenterX + shiftX, ptvCenterY + shiftY, ptv.w * 0.6 * beamCoverageFactor, ptv.h * 0.6 * beamCoverageFactor, isoColors.high, 0.8);
        // Medium dose (50% Rx) - larger spread
        createIsodoseEllipse(ptvCenterX + shiftX, ptvCenterY + shiftY, ptv.w * (1 + doseSpreadFactor*0.2) * beamCoverageFactor, ptv.h * (1 + doseSpreadFactor*0.2) * beamCoverageFactor, isoColors.medium, 0.6);
        // Low dose (entrance/exit) - even larger
        createIsodoseEllipse(ptvCenterX + shiftX, ptvCenterY + shiftY, ptv.w * (1.5 + doseSpreadFactor*0.5) * beamCoverageFactor, ptv.h * (1.5 + doseSpreadFactor*0.5) * beamCoverageFactor, isoColors.low, 0.4);
    }

    function createIsodoseEllipse(cx_pct, cy_pct, rx_pct, ry_pct, fillColor, opacity) {
        const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        ellipse.setAttribute("cx", `${Math.max(10,Math.min(90,cx_pct))}%`); // clamp within view
        ellipse.setAttribute("cy", `${Math.max(10,Math.min(90,cy_pct))}%`);
        ellipse.setAttribute("rx", `${Math.max(2,rx_pct)}%`);
        ellipse.setAttribute("ry", `${Math.max(2,ry_pct)}%`);
        ellipse.style.fill = fillColor;
        ellipse.style.opacity = opacity;
        isodoseOverlaySVG.appendChild(ellipse);
    }

    // --- Plan Summary UI Text Update ---
    function updatePlanSummaryUIText() {
        if (!dvhChart.data.datasets || dvhChart.data.datasets.length === 0) {
            planSummaryPTV.textContent = "N/A"; planSummaryOAR.textContent = "N/A"; planSummaryComplexity.textContent = "N/A";
            return;
        }
        // PTV Coverage (Conceptual: e.g. V95% > 95% of PTV volume)
        const ptvDataset = dvhChart.data.datasets.find(ds => ds.label.startsWith("PTV"));
        let ptvMetric = "Poor";
        if (ptvDataset) {
            const ninetyFivePercentDoseIndex = doseData.findIndex(d => d >= 95 * 0.9); // Assuming Rx is 95 (conceptual)
            if (ninetyFivePercentDoseIndex !== -1 && ptvDataset.data[ninetyFivePercentDoseIndex] > 95) ptvMetric = "Excellent (V95 > 95%)";
            else if (ninetyFivePercentDoseIndex !== -1 && ptvDataset.data[ninetyFivePercentDoseIndex] > 90) ptvMetric = "Good (V95 > 90%)";
            else if (ninetyFivePercentDoseIndex !== -1 && ptvDataset.data[ninetyFivePercentDoseIndex] > 80) ptvMetric = "Fair (V95 > 80%)";
        }
        planSummaryPTV.textContent = ptvMetric;
        planSummaryPTV.className = `font-semibold ${ptvMetric.includes("Excellent") ? 'text-green-700' : ptvMetric.includes("Good") ? 'text-green-600' : ptvMetric.includes("Fair") ? 'text-yellow-600': 'text-red-600'}`;


        // OAR Sparing (Conceptual: e.g. Rectum V70Gy < 20%)
        const rectumDataset = dvhChart.data.datasets.find(ds => ds.label.includes("Rectum"));
        let oarMetric = "N/A";
        if (rectumDataset) {
            const seventyGyIndex = doseData.findIndex(d => d >= 70); // Conceptual dose level for OAR constraint
            if (seventyGyIndex !== -1 && rectumDataset.data[seventyGyIndex] < 15) oarMetric = "Excellent (Rectum V70 < 15%)";
            else if (seventyGyIndex !== -1 && rectumDataset.data[seventyGyIndex] < 25) oarMetric = "Good (Rectum V70 < 25%)";
            else if (seventyGyIndex !== -1 && rectumDataset.data[seventyGyIndex] < 40) oarMetric = "Fair (Rectum V70 < 40%)";
            else oarMetric = "Poor (Rectum V70 High)";
        }
        planSummaryOAR.textContent = oarMetric;
         planSummaryOAR.className = `font-semibold ${oarMetric.includes("Excellent") ? 'text-green-700' : oarMetric.includes("Good") ? 'text-green-600' : oarMetric.includes("Fair") ? 'text-yellow-600': 'text-red-600'}`;


        // Complexity
        let complexity = "Low";
        if (beams.length > 4) complexity = "High";
        else if (beams.length > 2) complexity = "Moderate";
        planSummaryComplexity.textContent = complexity;
        planSummaryComplexity.className = `font-semibold ${complexity === "Low" ? 'text-blue-500' : complexity === "Moderate" ? 'text-blue-700' : 'text-purple-700'}`;

    }
    
    optimizePlanBtn.addEventListener('click', () => {
        // Conceptual: slightly improve DVH scores
        alert("Simulating plan optimization... (Conceptual: DVH might improve slightly)");
        // For a real effect, you'd adjust beam weights or use an algorithm
        beams.forEach(b => b.weight = Math.min(100, Math.max(10, b.weight + (Math.random()*20-10)) ) ); // Randomly tweak weights
        renderBeams(); // This will re-evaluate DVH
        updateWorkflowStep('step5');
    });
    approvePlanBtn.addEventListener('click', () => {
        alert("Plan Approved! (Conceptual Action)");
        updateWorkflowStep('step5');
    });

    // Initial Render
    renderBeams();
});