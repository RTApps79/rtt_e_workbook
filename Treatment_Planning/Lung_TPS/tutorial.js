/**
 * tutorial.js
 * Tutorial system for the Lung TPS Simulator.
 * This script expects `window.lungTpsContext` to be available, providing access
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
        this._tutorials = this._defineAllTutorials();
    }

    _createTutorialUI() {
        this.ui.panel = document.createElement('div');
        this.ui.panel.id = 'tutorialPanel';
        // Styles are similar to the previous tutorial panel, using Tailwind classes where possible for consistency
        this.ui.panel.className = 'fixed bottom-5 right-5 w-96 max-h-[500px] bg-white border border-gray-300 rounded-lg shadow-xl z-[1001] p-5 flex flex-col text-sm text-gray-700';
        this.ui.panel.style.display = 'none'; // Initially hidden

        this.ui.title = document.createElement('h3');
        this.ui.title.className = 'text-lg font-semibold text-indigo-700 mb-2 pb-2 border-b border-indigo-200';
        this.ui.panel.appendChild(this.ui.title);

        this.ui.text = document.createElement('div');
        this.ui.text.className = 'mb-3 overflow-y-auto flex-grow';
        this.ui.text.style.maxHeight = '280px'; // Adjusted for overall panel height
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
        return {
            "forwardLung": [
                {
                    title: "Forward Planning: Lung (3D CRT)",
                    text: "Welcome! This tutorial demonstrates <strong>Forward Planning (3D CRT)</strong> for a lung tumor. We'll manually place beams to cover the <strong>PTV (yellow dashed)</strong> while trying to spare OARs like Lungs, Spinal Cord, and Heart.<br><br>Ensure you are in 'Forward (3D CRT)' mode. The <strong>Carina (violet)</strong> and <strong>T4/T5 vertebrae (violet)</strong> are shown for anatomical reference.",
                    highlight: ['PTV_Lung_overlay', 'LANDMARK_Carina_overlay', 'LANDMARK_T4T5_overlay', 'tabForwardPlanning'],
                    onEnter: () => {
                        this.tps.switchPlanningMode?.('forward');
                        this.tps.clearBeams?.();
                        ['PTV_Lung', 'OAR_Lung_L', 'OAR_Lung_R', 'OAR_SpinalCord', 'OAR_Heart', 'LANDMARK_Carina', 'LANDMARK_T4T5'].forEach(id => this.tps.ensureStructureVisible?.(id));
                    }
                },
                {
                    title: "Step 1: Anterior Beam (AP)",
                    text: "Start with an Anterior-Posterior (AP) beam.<br>- Gantry Angle: <strong>0°</strong><br>- Field Size X: <strong>8 cm</strong>, Y: <strong>10 cm</strong><br>- Weight: <strong>50</strong><br>Click 'Add Beam'. This beam enters from the front, covering the PTV.",
                    highlight: ['gantryAngleInput', 'fieldSizeXInput', 'fieldSizeYInput', 'beamWeightInput', 'addBeamBtn'],
                    actionPrompt: "Set Gantry 0°, FSX 8, FSY 10, W 50, then 'Add Beam'.",
                    condition: () => this.tps.beams?.length === 1 && this.tps.beams[0].angle === 0 && this.tps.beams[0].sizeX === 8 && this.tps.beams[0].sizeY === 10,
                    onEnter: () => {
                        if(this.tps.gantryAngleInput) this.tps.gantryAngleInput.value = 0;
                        if(this.tps.fieldSizeXInput) this.tps.fieldSizeXInput.value = 8;
                        if(this.tps.fieldSizeYInput) this.tps.fieldSizeYInput.value = 10;
                        if(this.tps.beamWeightInput) this.tps.beamWeightInput.value = 50;
                    }
                },
                {
                    title: "Step 2: Posterior Beam (PA)",
                    text: "Add an opposing Posterior-Anterior (PA) beam for more uniform PTV dose along this axis.<br>- Gantry Angle: <strong>180°</strong><br>- Field Size X: <strong>8 cm</strong>, Y: <strong>10 cm</strong><br>- Weight: <strong>50</strong><br>Click 'Add Beam'.",
                    highlight: ['gantryAngleInput', 'addBeamBtn'],
                    actionPrompt: "Set Gantry 180°, FSX 8, FSY 10, W 50, then 'Add Beam'.",
                    condition: () => this.tps.beams?.length === 2 && this.tps.beams.some(b => b.angle === 180 && b.sizeX === 8 && b.sizeY === 10),
                    onEnter: () => { if(this.tps.gantryAngleInput) this.tps.gantryAngleInput.value = 180; /* Keep other values */ }
                },
                {
                    title: "Observe AP/PA Plan",
                    text: "The PTV is now irradiated from front and back. However, notice the <strong>Spinal Cord (red)</strong> is directly in the path of the posterior beam. The <strong>Heart (pink)</strong> might also receive significant dose depending on PTV location. Check the DVH and Plan Summary.",
                    highlight: ['dvhChartCanvas', 'summary_Cord_Max', 'OAR_SpinalCord_overlay', 'OAR_Heart_overlay'],
                },
                {
                    title: "Step 3: Angled Beams to Spare Cord",
                    text: "AP/PA is often not ideal for lung if the cord is close. Let's try angled beams. First, clear existing beams. Then add two beams:<br>1. Gantry: <strong>45°</strong> (Right Anterior Oblique - RAO), FSX:7, FSY:11, W:50<br>2. Gantry: <strong>315°</strong> (Left Anterior Oblique - LAO), FSX:7, FSY:11, W:50<br>These try to avoid direct entry/exit through the cord.",
                    highlight: ['clearBeamsBtn', 'gantryAngleInput', 'addBeamBtn'],
                    actionPrompt: "Clear beams. Add beam at 45° (FSX:7,FSY:11,W:50), then at 315° (same FS/W).",
                    onEnter: () => {
                        this.tps.clearBeams?.();
                        if(this.tps.gantryAngleInput) this.tps.gantryAngleInput.value = 45;
                        if(this.tps.fieldSizeXInput) this.tps.fieldSizeXInput.value = 7;
                        if(this.tps.fieldSizeYInput) this.tps.fieldSizeYInput.value = 11;
                        if(this.tps.beamWeightInput) this.tps.beamWeightInput.value = 50;
                    },
                    condition: () => this.tps.beams?.length === 2 && this.tps.beams.some(b => b.angle === 45) && this.tps.beams.some(b => b.angle === 315),
                },
                 {
                    title: "Step 4: Add Posterior Obliques",
                    text: "To complement the anterior obliques, add two posterior oblique beams:<br>1. Gantry: <strong>135°</strong> (Right Posterior Oblique - RPO), FSX:7, FSY:11, W:50<br>2. Gantry: <strong>225°</strong> (Left Posterior Oblique - LPO), FSX:7, FSY:11, W:50<br>This creates a common 4-field oblique setup.",
                    highlight: ['gantryAngleInput', 'addBeamBtn'],
                    actionPrompt: "Add beam at 135° (FSX:7,FSY:11,W:50), then at 225° (same FS/W).",
                    onEnter: () => {
                        if(this.tps.gantryAngleInput) this.tps.gantryAngleInput.value = 135;
                        if(this.tps.fieldSizeXInput) this.tps.fieldSizeXInput.value = 7;
                        if(this.tps.fieldSizeYInput) this.tps.fieldSizeYInput.value = 11;
                        if(this.tps.beamWeightInput) this.tps.beamWeightInput.value = 50;
                    },
                    condition: () => this.tps.beams?.length === 4 && this.tps.beams.some(b => b.angle === 135) && this.tps.beams.some(b => b.angle === 225),
                },
                {
                    title: "Evaluate Oblique Plan",
                    text: "This oblique setup should offer better <strong>Spinal Cord</strong> sparing compared to AP/PA. However, a larger volume of healthy <strong>Lung (green)</strong> might be irradiated at lower doses. Check the DVH for Lung V20Gy and Mean Lung Dose. <br><br>Forward planning often involves such trade-offs.",
                    highlight: ['dvhChartCanvas', 'summary_Lung_V20', 'summary_Cord_Max', 'OAR_Lung_L_overlay'],
                    onExit: () => { if (typeof alert !== 'undefined') alert("Forward Planning (Lung) Tutorial Complete!"); }
                }
            ],
            "inverseLung": [
                {
                    title: "Inverse Planning: Lung (IMRT Concept)",
                    text: "This tutorial demonstrates conceptual <strong>Inverse Planning (IMRT)</strong>. Instead of manually setting beams, we define dose objectives for the PTV and OARs, and the system (conceptually) optimizes the plan.<br><br>Switch to 'Inverse (IMRT Concept)' mode.",
                    highlight: ['tabInversePlanning'],
                    onEnter: () => {
                        this.tps.switchPlanningMode?.('inverse');
                        this.tps.clearBeams?.();
                        ['PTV_Lung', 'OAR_Lung_L', 'OAR_Lung_R', 'OAR_SpinalCord', 'OAR_Heart', 'LANDMARK_Carina', 'LANDMARK_T4T5'].forEach(id => this.tps.ensureStructureVisible?.(id));
                    },
                    condition: () => this.tps.currentPlanningMode === 'inverse'
                },
                {
                    title: "Step 1: Define Dose Objectives",
                    text: "Input the desired dose constraints for the PTV and OARs. For example:<br>- PTV D95%: <strong>60 Gy</strong><br>- Cord Max: <strong>&lt; 45 Gy</strong><br>- Lung V20Gy: <strong>&lt; 30%</strong><br>- Lung Mean: <strong>&lt; 20 Gy</strong><br>- Heart Mean: <strong>&lt; 26 Gy</strong><br>- Heart V30Gy: <strong>&lt; 40 %</strong>",
                    highlight: ['ptvD95Input', 'cordMaxInput', 'lungV20Input', 'lungMeanInput', 'heartMeanInput', 'heartV30Input'],
                    actionPrompt: "Enter the suggested dose objectives in the input fields.",
                    condition: () => parseFloat(this.tps.ptvD95Input?.value) === 60 && parseFloat(this.tps.cordMaxInput?.value) === 45 && parseFloat(this.tps.lungV20Input?.value) === 30 && parseFloat(this.tps.lungMeanInput?.value) === 20 && parseFloat(this.tps.heartMeanInput?.value) === 26 && parseFloat(this.tps.heartV30Input?.value) === 40,
                    onEnter: () => { // Pre-fill values for user convenience
                        if(this.tps.ptvD95Input) this.tps.ptvD95Input.value = 60;
                        if(this.tps.cordMaxInput) this.tps.cordMaxInput.value = 45;
                        if(this.tps.lungV20Input) this.tps.lungV20Input.value = 30;
                        if(this.tps.lungMeanInput) this.tps.lungMeanInput.value = 20;
                        if(this.tps.heartMeanInput) this.tps.heartMeanInput.value = 26;
                        if(this.tps.heartV30Input) this.tps.heartV30Input.value = 40;
                    }
                },
                {
                    title: "Step 2: Simulate IMRT Optimization",
                    text: "Now, click the <strong>'Optimize Plan (Simulate IMRT)'</strong> button. The system will conceptually generate a plan with multiple modulated beams to try and meet your objectives.",
                    highlight: 'simulateImrtBtn',
                    actionPrompt: "Click 'Optimize Plan (Simulate IMRT)'.",
                    condition: () => this.tps.beams?.length > 0 && this.tps.planTypeText?.textContent.includes("IMRT"),
                },
                {
                    title: "Evaluate Simulated IMRT Plan",
                    text: "Observe the DVH and Plan Summary. Conceptually, an IMRT plan can achieve: <br>- Higher PTV conformity (steeper PTV curve).<br>- Better OAR sparing, especially for complex shapes or close OARs (lower OAR curves).<br><br>Compare this to the results from the Forward Planning tutorial. IMRT often allows for more optimal dose distributions.",
                    highlight: ['dvhChartCanvas', 'summary_PTV_D95', 'summary_Cord_Max', 'summary_Lung_V20'],
                    onExit: () => { if (typeof alert !== 'undefined') alert("Inverse Planning (IMRT Concept) Tutorial Complete!"); }
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
        // Check if elementIdOrRef is a direct DOM element from tpsContext, otherwise assume it's an ID string
        const element = (this.tps && typeof elementIdOrRef === 'string' && this.tps[elementIdOrRef] && this.tps[elementIdOrRef].nodeType === 1)
            ? this.tps[elementIdOrRef]
            : (typeof elementIdOrRef === 'string' ? document.getElementById(elementIdOrRef) : elementIdOrRef);


        if (element && typeof element.getBoundingClientRect === 'function') { // Check if it's a valid element
            if (!isMultiple || this.ui.highlightBox.style.display === 'none') {
                 // Scroll the main panel if the element is inside a scrollable tps-panel
                let parentPanel = element.closest('.tps-panel');
                if (parentPanel) {
                    const panelRect = parentPanel.getBoundingClientRect();
                    const elementRect = element.getBoundingClientRect();
                    // Check if element is not fully visible within the panel
                    if (elementRect.top < panelRect.top || elementRect.bottom > panelRect.bottom) {
                         element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                    }
                } else {
                    // Fallback for elements not in a tps-panel or if closest fails
                    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                }

                // Wait a brief moment for scrolling to complete before getting rect
                setTimeout(() => {
                    const rect = element.getBoundingClientRect();
                    this.ui.highlightBox.style.left = `${rect.left + window.scrollX - 5}px`;
                    this.ui.highlightBox.style.top = `${rect.top + window.scrollY - 5}px`;
                    this.ui.highlightBox.style.width = `${rect.width + 10}px`;
                    this.ui.highlightBox.style.height = `${rect.height + 10}px`;
                    this.ui.highlightBox.style.display = 'block';
                }, 150); // Adjust delay if needed
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
// This part should be in a <script> tag in your index.html,
// or at the end of main.js after window.lungTpsContext is fully defined.

document.addEventListener('DOMContentLoaded', () => {
    // Ensure this runs after main.js has initialized lungTpsContext
    if (window.lungTpsContext) {
        const lungTpsTutorial = new TpsTutorial(window.lungTpsContext);
        window.lungTpsTutorial = lungTpsTutorial; // Make it globally accessible for buttons in HTML

        // The tutorial buttons in index.html should now work as their onclick attributes
        // will call window.lungTpsTutorial.startTutorial(...).
        console.log("Lung TPS Tutorial system initialized and ready.");

    } else {
        console.error("Lung TPS Context (window.lungTpsContext) not found. Tutorial cannot be initialized.");
        const tutorialButtonContainer = document.getElementById('tutorialButtonsContainer');
        if(tutorialButtonContainer) { // Display error message if buttons exist
            tutorialButtonContainer.innerHTML = '<p class="text-xs text-red-400 px-2 py-1">Tutorials unavailable (context error).</p>';
        }
    }
});
