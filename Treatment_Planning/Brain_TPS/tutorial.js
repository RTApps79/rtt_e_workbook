/**
 * tutorial.js
 * Tutorial system for the TPS Simulator.
 * This script expects `window.tpsContext` to be available, providing access
 * to the main TPS application's elements, state, and functions.
 * It should be included in index.html AFTER main.js.
 */

class TpsTutorial {
    constructor(tpsContext) {
        this.tps = tpsContext; // Handle to access main TPS elements and state
        this.currentTutorialName = null;
        this.currentStepIndex = -1;
        this.tutorialSteps = [];

        this.ui = {
            panel: null, title: null, text: null, nextBtn: null,
            prevBtn: null, exitBtn: null, highlightBox: null, actionRequiredText: null,
        };

        this._createTutorialUI();
        this._tutorials = this._defineAllTutorials(); // Defines all tutorials including lung and brain
    }

    _createTutorialUI() {
        // UI creation logic is the same as before...
        this.ui.panel = document.createElement('div');
        this.ui.panel.id = 'tutorialPanel';
        this.ui.panel.className = 'fixed bottom-5 right-5 w-96 max-h-[500px] bg-white border border-gray-300 rounded-lg shadow-xl z-[1001] p-5 flex flex-col text-sm text-gray-700';
        this.ui.panel.style.display = 'none';

        this.ui.title = document.createElement('h3');
        this.ui.title.className = 'text-lg font-semibold text-indigo-700 mb-2 pb-2 border-b border-indigo-200';
        this.ui.panel.appendChild(this.ui.title);

        this.ui.text = document.createElement('div');
        this.ui.text.className = 'mb-3 overflow-y-auto flex-grow';
        this.ui.text.style.maxHeight = '280px';
        this.ui.panel.appendChild(this.ui.text);

        this.ui.actionRequiredText = document.createElement('p');
        this.ui.actionRequiredText.className = 'text-xs text-amber-700 font-medium my-2 py-1.5 px-2.5 bg-amber-100 border border-amber-300 rounded-md';
        this.ui.actionRequiredText.style.display = 'none';
        this.ui.panel.appendChild(this.ui.actionRequiredText);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'mt-auto pt-3 border-t border-gray-200 flex justify-between items-center';

        const navButtonsDiv = document.createElement('div');
        this.ui.prevBtn = document.createElement('button');
        this.ui.prevBtn.textContent = 'Previous';
        this.ui.prevBtn.className = 'bg-slate-500 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md text-xs shadow-sm transition-colors disabled:opacity-60';
        this.ui.prevBtn.onclick = () => this.goToStep(this.currentStepIndex - 1);
        navButtonsDiv.appendChild(this.ui.prevBtn);

        this.ui.nextBtn = document.createElement('button');
        this.ui.nextBtn.textContent = 'Next';
        this.ui.nextBtn.className = 'bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs shadow-sm transition-colors ml-2 disabled:opacity-60';
        this.ui.nextBtn.onclick = () => this.attemptNextStep();
        navButtonsDiv.appendChild(this.ui.nextBtn);
        buttonsDiv.appendChild(navButtonsDiv);

        this.ui.exitBtn = document.createElement('button');
        this.ui.exitBtn.textContent = 'Exit Tutorial';
        this.ui.exitBtn.className = 'bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-xs shadow-sm transition-colors';
        this.ui.exitBtn.onclick = () => this.stopTutorial();
        buttonsDiv.appendChild(this.ui.exitBtn);

        this.ui.panel.appendChild(buttonsDiv);
        document.body.appendChild(this.ui.panel);

        this.ui.highlightBox = document.createElement('div');
        this.ui.highlightBox.id = 'tutorialHighlightBox';
        this.ui.highlightBox.style.cssText = `
            position: absolute; border: 3px dashed #ef4444; /* Red-500 */
            background-color: rgba(239, 68, 68, 0.1);
            border-radius: 6px; z-index: 1000; display: none; pointer-events: none;
            transition: all 0.25s ease-in-out; box-sizing: border-box;
        `;
        document.body.appendChild(this.ui.highlightBox);
    }

    _defineAllTutorials() {
        // These arrays help manage structure visibility for different anatomy sites.
        // Ensure the IDs match the keys in your main.js `structures` object OR the element IDs.
        const brainStructureKeys = [ // Assuming these are keys in tps.structures
            'PTV_WholeBrain', 'OAR_Eye_L', 'OAR_Eye_R',
            'OAR_Lens_L', 'OAR_Lens_R', 'OAR_OpticNerve_L',
            'OAR_OpticNerve_R', 'OAR_OpticChiasm', 'OAR_Brainstem'
        ];
        // Example for lung structures, if your main.js supports switching datasets
        const lungStructureKeys = [
            'PTV_Lung', 'OAR_Lung_L', 'OAR_Lung_R',
            'OAR_SpinalCord', 'OAR_Heart', 'OAR_Esophagus',
            'LANDMARK_Carina', 'LANDMARK_T4T5' // Assuming these are also keys
        ];


        return {
            // --- LUNG TUTORIALS (Example structure, adapt if your TPS is multi-site) ---
            "forwardLung": [
                {
                    title: "Forward Planning: Lung (3D CRT)",
                    text: "This tutorial demonstrates <strong>Forward Planning (3D CRT)</strong> for a lung tumor. We'll manually place beams to cover the <strong>PTV</strong> while trying to spare OARs like Lungs, Spinal Cord, and Heart.<br><br>Ensure you are in 'Forward (3D CRT)' mode. Anatomical landmarks like the <strong>Carina</strong> and <strong>T4/T5 vertebrae</strong> are shown for reference if available in this TPS version.",
                    highlight: ['PTV_Lung_overlay', 'LANDMARK_Carina_overlay', 'tabForwardPlanning'], // Example highlights
                    onEnter: () => {
                        this.tps.switchPlanningMode?.('forward');
                        this.tps.clearBeams?.();
                        this.tps.setStructureVisibility?.(lungStructureKeys, true);  // Show lung structures
                        this.tps.setStructureVisibility?.(brainStructureKeys, false); // Hide brain structures
                        // Potentially load lung patient data if your TPS supports it
                        // this.tps.loadPatientData?.('lung');
                    }
                },
                // ... (Add detailed steps for forwardLung tutorial here, similar to previous versions) ...
                {
                    title: "Lung Forward Plan: End",
                    text: "Forward planning for lung often involves balancing PTV coverage with sparing of critical structures like the lungs, heart, and spinal cord. Oblique beams can help.",
                    onExit: () => { if (typeof alert !== 'undefined') alert("Lung Forward Planning Tutorial Complete!"); }
                }
            ],
            "inverseLung": [
                {
                    title: "Inverse Planning: Lung (IMRT Concept)",
                    text: "This tutorial demonstrates conceptual <strong>Inverse Planning (IMRT)</strong> for lung. We define dose objectives, and the system (conceptually) optimizes the plan.<br><br>Switch to 'Inverse (IMRT Concept)' mode.",
                    highlight: ['tabInversePlanning'],
                    onEnter: () => {
                        this.tps.switchPlanningMode?.('inverse');
                        this.tps.clearBeams?.();
                        this.tps.setStructureVisibility?.(lungStructureKeys, true);
                        this.tps.setStructureVisibility?.(brainStructureKeys, false);
                        // this.tps.loadPatientData?.('lung');
                    },
                    condition: () => this.tps.currentPlanningMode === 'inverse'
                },
                // ... (Add detailed steps for inverseLung tutorial here) ...
                {
                    title: "Lung Inverse Plan: End",
                    text: "Conceptual IMRT for lung aims to achieve better PTV conformity and OAR sparing by modulating beam intensities based on defined objectives.",
                    onExit: () => { if (typeof alert !== 'undefined') alert("Lung Inverse Planning Tutorial Complete!"); }
                }
            ],

            // --- WHOLE BRAIN TUTORIALS ---
            "popWholeBrain": [
                {
                    title: "POP Whole Brain RT",
                    text: "This tutorial demonstrates a simple <strong>Parallel Opposed Pair (POP)</strong> technique for Whole Brain Radiotherapy (WBRT). Goal: treat the entire brain (PTV) while being aware of dose to eyes, lenses, and brainstem.<br><br>Ensure you are in 'Forward (POP)' mode.",
                    highlight: ['tabForwardPlanning', 'PTV_WholeBrain_overlay'],
                    onEnter: () => {
                        this.tps.switchPlanningMode?.('forward');
                        this.tps.clearBeams?.();
                        this.tps.setStructureVisibility?.(brainStructureKeys, true); // Show brain structures
                        this.tps.setStructureVisibility?.(lungStructureKeys, false);  // Hide lung structures
                        // Potentially load brain patient data if your TPS supports it
                        // this.tps.loadPatientData?.('brain');
                    },
                    condition: () => this.tps.currentPlanningMode === 'forward'
                },
                {
                    title: "Step 1: Right Lateral Beam (90°)",
                    text: "Set up the Right Lateral beam.<br>- Gantry Angle: <strong>90°</strong><br>- Field Size X: <strong>16 cm</strong><br>- Field Size Y: <strong>20 cm</strong><br>- Weight: <strong>50</strong><br>Click 'Add Beam'. These field sizes are typical for encompassing the whole brain.",
                    highlight: ['gantryAngleInput', 'fieldSizeXInput', 'fieldSizeYInput', 'beamWeightInput', 'addBeamBtn'],
                    actionPrompt: "Set Gantry 90°, FSX 16, FSY 20, W 50, then 'Add Beam'.",
                    condition: () => this.tps.beams?.length === 1 && this.tps.beams[0].angle === 90 && this.tps.beams[0].sizeX === 16 && this.tps.beams[0].sizeY === 20,
                    onEnter: () => {
                        if(this.tps.gantryAngleInput) this.tps.gantryAngleInput.value = 90;
                        if(this.tps.fieldSizeXInput) this.tps.fieldSizeXInput.value = 16;
                        if(this.tps.fieldSizeYInput) this.tps.fieldSizeYInput.value = 20;
                        if(this.tps.beamWeightInput) this.tps.beamWeightInput.value = 50;
                    }
                },
                {
                    title: "Step 2: Left Lateral Beam (270°)",
                    text: "Add the opposing Left Lateral beam.<br>- Gantry Angle: <strong>270°</strong><br>- Field Size X: <strong>16 cm</strong><br>- Field Size Y: <strong>20 cm</strong><br>- Weight: <strong>50</strong><br>Click 'Add Beam'.",
                    highlight: ['gantryAngleInput', 'addBeamBtn'],
                    actionPrompt: "Set Gantry 270°, FSX 16, FSY 20, W 50, then 'Add Beam'.",
                    condition: () => this.tps.beams?.length === 2 && this.tps.beams.some(b => b.angle === 270 && b.sizeX === 16 && b.sizeY === 20),
                    onEnter: () => { if(this.tps.gantryAngleInput) this.tps.gantryAngleInput.value = 270; }
                },
                {
                    title: "Observe POP WBRT Plan",
                    text: "This technique delivers a relatively uniform dose to the entire brain (PTV). Note the dose to OARs like <strong>Eyes, Lenses, Optic Nerves/Chiasm, and Brainstem</strong>. With large lateral fields, these structures receive a significant portion of the prescribed dose. WBRT prioritizes broad coverage. Check the DVH.",
                    highlight: ['dvhChartCanvas', 'OAR_Eye_L_overlay', 'OAR_Lens_L_overlay', 'OAR_Brainstem_overlay', 'summary_PTV_D95_wb', 'summary_Lens_Max_wb'],
                    onExit: () => { if (typeof alert !== 'undefined') alert("POP Whole Brain Tutorial Complete!"); }
                }
            ],
            "arcWholeBrain": [
                {
                    title: "Arc Whole Brain RT (Concept)",
                    text: "This tutorial demonstrates a conceptual <strong>Arc-based technique</strong> for WBRT. The aim is still to treat the whole brain, but an arc might offer slightly better dose shaping or avoidance of specific OARs like lenses, if clinically desired.<br><br>Switch to 'Inverse (Arc Concept)' mode.",
                    highlight: ['tabInversePlanning', 'PTV_WholeBrain_overlay'],
                    onEnter: () => {
                        this.tps.switchPlanningMode?.('inverse');
                        this.tps.clearBeams?.();
                        this.tps.setStructureVisibility?.(brainStructureKeys, true);
                        this.tps.setStructureVisibility?.(lungStructureKeys, false);
                        // this.tps.loadPatientData?.('brain');
                    },
                    condition: () => this.tps.currentPlanningMode === 'inverse'
                },
                {
                    title: "Step 1: Define Arc Objectives",
                    text: "Set simplified dose objectives for an arc WBRT plan:<br>- PTV Whole Brain D95%: <strong>30 Gy</strong> (typical WBRT dose)<br>- Lenses Max: <strong>&lt; 7 Gy</strong> (Try to spare lenses more with arc)<br>- Eyes Max: <strong>&lt; 15 Gy</strong> (Conceptual)<br>- Brainstem Max: <strong>&lt; 30 Gy</strong><br>- Chiasm Max: <strong>&lt; 30 Gy</strong>",
                    highlight: ['ptvD95Input', 'lensMaxInput', 'eyeMaxInput', 'brainstemMaxInput', 'chiasmMaxInput'],
                    actionPrompt: "Enter suggested dose objectives. Use the specific WBRT input fields.",
                    condition: () => parseFloat(this.tps.ptvD95Input?.value) === 30 && parseFloat(this.tps.lensMaxInput?.value) <= 7 && parseFloat(this.tps.brainstemMaxInput?.value) <=30,
                    onEnter: () => { // Pre-fill WBRT specific objective inputs
                        if(this.tps.ptvD95Input) this.tps.ptvD95Input.value = 30; // Assumes ptvD95Input is generic
                        if(this.tps.lensMaxInput) this.tps.lensMaxInput.value = 7;
                        if(this.tps.eyeMaxInput) this.tps.eyeMaxInput.value = 15;
                        if(this.tps.brainstemMaxInput) this.tps.brainstemMaxInput.value = 30;
                        if(this.tps.chiasmMaxInput) this.tps.chiasmMaxInput.value = 30;
                    }
                },
                {
                    title: "Step 2: Simulate Arc Optimization",
                    text: "Click <strong>'Optimize Plan (Simulate Arc)'</strong>. The system will simulate an optimized arc (e.g., VMAT-like) plan. This involves the gantry rotating around the patient while shaping the beam.",
                    highlight: 'simulateImrtBtn', // This button's text might change based on mode in main.js
                    actionPrompt: "Click 'Optimize Plan (Simulate Arc)'.",
                    condition: () => this.tps.beams?.length > 0 && this.tps.planTypeText?.textContent.includes("Arc"),
                },
                {
                    title: "Evaluate Simulated Arc WBRT",
                    text: "Observe the DVH. An arc can potentially offer better dose conformity and some sparing of OARs like the <strong>Lenses</strong> compared to a simple POP technique, even in WBRT. However, achieving significant sparing for all OARs in WBRT is challenging due to the large target volume. The primary goal is homogeneous PTV coverage.",
                    highlight: ['dvhChartCanvas', 'OAR_Lens_L_overlay', 'OAR_Eye_L_overlay', 'summary_PTV_D95_wb', 'summary_Lens_Max_wb'],
                    onExit: () => { if (typeof alert !== 'undefined') alert("Arc Whole Brain (Conceptual) Tutorial Complete!"); }
                }
            ]
        };
    }

    startTutorial(tutorialName) {
        if (!this.tps) {
            console.error("TPS Context not provided to tutorial system.");
            if (typeof alert !== 'undefined') alert("Tutorial system error: TPS context missing.");
            return;
        }
        if (!this._tutorials[tutorialName]) {
            console.error("Tutorial not found:", tutorialName);
            if (typeof alert !== 'undefined') alert(`Tutorial "${tutorialName}" not found.`);
            return;
        }
        this.currentTutorialName = tutorialName;
        this.tutorialSteps = this._tutorials[tutorialName];
        this.currentStepIndex = -1;
        this.ui.panel.style.display = 'flex';
        this.goToStep(0);
    }

    stopTutorial() {
        this.ui.panel.style.display = 'none';
        this._removeHighlight();
        this.ui.actionRequiredText.style.display = 'none';
        this.currentTutorialName = null;
        this.currentStepIndex = -1;
    }

    attemptNextStep() {
        if (this.currentStepIndex < 0 || this.currentStepIndex >= this.tutorialSteps.length) return;

        const currentStep = this.tutorialSteps[this.currentStepIndex];
        if (currentStep.condition && !currentStep.condition()) {
            this.ui.actionRequiredText.innerHTML = currentStep.actionPrompt || "Please complete the current action as described.";
            this.ui.actionRequiredText.style.display = 'block';
            if (currentStep.highlight) this._highlightElement(Array.isArray(currentStep.highlight) ? currentStep.highlight[0] : currentStep.highlight);
            return;
        }
        this.ui.actionRequiredText.style.display = 'none';
        this.goToStep(this.currentStepIndex + 1);
    }

    goToStep(stepIndex) {
        if (this.currentStepIndex !== -1 && this.currentStepIndex < stepIndex && this.tutorialSteps[this.currentStepIndex]?.onExit) {
            this.tutorialSteps[this.currentStepIndex].onExit();
        }

        if (stepIndex < 0 || stepIndex >= this.tutorialSteps.length) {
            if (stepIndex >= this.tutorialSteps.length && this.tutorialSteps[this.currentStepIndex]?.onExit) {
                 this.tutorialSteps[this.currentStepIndex].onExit();
            }
            this.stopTutorial();
            return;
        }

        this.currentStepIndex = stepIndex;
        const step = this.tutorialSteps[stepIndex];

        this.ui.title.innerHTML = step.title || `Step ${stepIndex + 1}`;
        this.ui.text.innerHTML = step.text;

        this._removeHighlight();
        if (step.highlight) {
            const elementsToHighlight = Array.isArray(step.highlight) ? step.highlight : [step.highlight];
            elementsToHighlight.forEach(elId => this._highlightElement(elId, elementsToHighlight.length > 1));
        }

        step.onEnter?.();
        this.ui.prevBtn.disabled = stepIndex === 0;
        this.ui.nextBtn.textContent = (stepIndex === this.tutorialSteps.length - 1) ? "Finish" : "Next";
        this.ui.actionRequiredText.style.display = 'none';
    }

   _highlightElement(elementIdOrRef, isMultiple = false) {
        const element = (this.tps && typeof elementIdOrRef === 'string' && this.tps[elementIdOrRef] && this.tps[elementIdOrRef].nodeType === 1)
            ? this.tps[elementIdOrRef]
            : (typeof elementIdOrRef === 'string' ? document.getElementById(elementIdOrRef) : elementIdOrRef);

        if (element && typeof element.getBoundingClientRect === 'function') {
            if (!isMultiple || this.ui.highlightBox.style.display === 'none') {
                let parentPanel = element.closest('.tps-panel'); // Check if element is inside a scrollable panel
                if (parentPanel && (parentPanel.scrollHeight > parentPanel.clientHeight || parentPanel.scrollWidth > parentPanel.clientWidth) ) {
                    const panelRect = parentPanel.getBoundingClientRect();
                    const elementRect = element.getBoundingClientRect();
                     // Scroll only if element is not fully visible or near edges
                    if (elementRect.top < panelRect.top + 10 || elementRect.bottom > panelRect.bottom - 10 || elementRect.left < panelRect.left + 10 || elementRect.right > panelRect.right - 10) {
                         element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                    }
                } else if (!parentPanel) { // If not in a tps-panel, scroll window
                    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                }
                // Short delay for scroll to settle before getting final rect
                setTimeout(() => {
                    const rect = element.getBoundingClientRect();
                    this.ui.highlightBox.style.left = `${rect.left + window.scrollX - 5}px`;
                    this.ui.highlightBox.style.top = `${rect.top + window.scrollY - 5}px`;
                    this.ui.highlightBox.style.width = `${rect.width + 10}px`;
                    this.ui.highlightBox.style.height = `${rect.height + 10}px`;
                    this.ui.highlightBox.style.display = 'block';
                }, 150);
            }
        } else {
            console.warn("Tutorial highlight: Element not found or invalid -", elementIdOrRef);
            if (!isMultiple) this._removeHighlight();
        }
    }

    _removeHighlight() {
        this.ui.highlightBox.style.display = 'none';
    }
}

// --- Initialization in the main HTML page (after main.js and this file) ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.tpsContext) { // Using generic tpsContext as defined in main.js
        const tpsTutorialInstance = new TpsTutorial(window.tpsContext);
        window.tpsTutorial = tpsTutorialInstance; // Make it globally accessible

        console.log("TPS Tutorial system initialized and ready.");

        // Dynamically create tutorial buttons
        const tutorialButtonContainer = document.getElementById('tutorialButtonsContainer');
        if (tutorialButtonContainer) {
            tutorialButtonContainer.innerHTML = ''; // Clear any existing buttons

            const tutorialsAvailable = [
                // {name: "Lung: Forward Plan", id: "forwardLung", class: "bg-sky-500 hover:bg-sky-600"}, // Uncomment if lung tutorials are also active
                // {name: "Lung: Inverse Plan", id: "inverseLung", class: "bg-teal-500 hover:bg-teal-600"}, // Uncomment if lung tutorials are also active
                {name: "Brain: POP Plan", id: "popWholeBrain", class: "bg-fuchsia-500 hover:bg-fuchsia-600"},
                {name: "Brain: Arc Plan", id: "arcWholeBrain", class: "bg-purple-500 hover:bg-purple-600"}
            ];

            tutorialsAvailable.forEach(tut => {
                const button = document.createElement('button');
                button.textContent = tut.name;
                button.className = `${tut.class} text-white px-2 py-1 text-xs rounded-md shadow transition-colors ml-2`;
                button.onclick = () => window.tpsTutorial.startTutorial(tut.id);
                tutorialButtonContainer.appendChild(button);
            });
        }

    } else {
        console.error("TPS Context (window.tpsContext) not found. Tutorial cannot be initialized.");
        const tutorialButtonContainer = document.getElementById('tutorialButtonsContainer');
        if(tutorialButtonContainer) {
            tutorialButtonContainer.innerHTML = '<p class="text-xs text-red-400 px-2 py-1">Tutorials unavailable (context error).</p>';
        }
    }
});
