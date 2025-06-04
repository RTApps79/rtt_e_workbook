/**
 * TpsTutorial.js
 * A script to create a step-by-step tutorial system for the Virtual TPS.
 *
 * How to use:
 * 1. Save this code as 'tutorial.js' and include it in your main HTML file
 * AFTER your main TPS script.
 * <script src="your_tps_script.js"></script>
 * <script src="tutorial.js"></script>
 * 2. In your main TPS script (e.g., within DOMContentLoaded or after your TPS app is initialized):
 * a. Create a `tpsContext` object. This object should provide the tutorial script
 * with access to the necessary DOM elements, state variables (like the `beams` array),
 * and potentially helper functions from your main TPS application.
 * b. Instantiate the tutorial: `const tpsTutorial = new TpsTutorial(tpsContext);`
 * c. Add buttons or links in your main TPS UI to start specific tutorials, e.g.:
 * `<button onclick="tpsTutorial.startTutorial('excellentPTV')">Good Plan Tutorial</button>`
 * `<button onclick="tpsTutorial.startTutorial('suboptimalPlan')">Bad Plan Demo</button>`
 */

class TpsTutorial {
    constructor(tpsContext) {
        // tpsContext should provide access to the main TPS application's
        // DOM elements, state, and relevant functions.
        this.tps = tpsContext;
        this.currentTutorialName = null;
        this.currentStepIndex = -1;
        this.tutorialSteps = [];

        this.ui = {
            panel: null,
            title: null,
            text: null,
            nextBtn: null,
            prevBtn: null,
            exitBtn: null,
            highlightBox: null,
            actionRequiredText: null,
        };

        this._createTutorialUI();
        this._tutorials = this._defineAllTutorials(); // Define all tutorials
    }

    _createTutorialUI() {
        // Create a floating panel for tutorial instructions
        this.ui.panel = document.createElement('div');
        this.ui.panel.id = 'tutorialPanel';
        this.ui.panel.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; width: 380px; max-height: 450px;
            background-color: #ffffff; border: 1px solid #ccc; border-radius: 10px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.25); z-index: 1001;
            padding: 20px; display: none; flex-direction: column;
            font-family: 'Inter', sans-serif; font-size: 0.9rem; color: #333;
        `;

        this.ui.title = document.createElement('h3');
        this.ui.title.className = 'text-xl font-bold text-purple-700 mb-3 pb-2 border-b border-purple-200';
        this.ui.panel.appendChild(this.ui.title);

        this.ui.text = document.createElement('div'); // Changed to div for richer content
        this.ui.text.className = 'mb-4 text-sm text-slate-700 overflow-y-auto flex-grow';
        this.ui.text.style.maxHeight = '250px'; // Increased max height
        this.ui.panel.appendChild(this.ui.text);

        this.ui.actionRequiredText = document.createElement('p');
        this.ui.actionRequiredText.className = 'text-xs text-amber-600 font-semibold my-2 py-1 px-2 bg-amber-50 border border-amber-300 rounded';
        this.ui.actionRequiredText.style.display = 'none'; // Initially hidden
        this.ui.panel.appendChild(this.ui.actionRequiredText);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'mt-auto pt-3 border-t border-slate-200 flex justify-between items-center';

        const navButtonsDiv = document.createElement('div');
        this.ui.prevBtn = document.createElement('button');
        this.ui.prevBtn.textContent = 'Previous';
        this.ui.prevBtn.className = 'bg-slate-500 text-white px-4 py-2 rounded-md text-xs hover:bg-slate-600 transition-colors mr-2 disabled:opacity-50';
        this.ui.prevBtn.onclick = () => this.goToStep(this.currentStepIndex - 1);
        navButtonsDiv.appendChild(this.ui.prevBtn);

        this.ui.nextBtn = document.createElement('button');
        this.ui.nextBtn.textContent = 'Next';
        this.ui.nextBtn.className = 'bg-purple-600 text-white px-4 py-2 rounded-md text-xs hover:bg-purple-700 transition-colors disabled:opacity-50';
        this.ui.nextBtn.onclick = () => this.attemptNextStep();
        navButtonsDiv.appendChild(this.ui.nextBtn);
        buttonsDiv.appendChild(navButtonsDiv);

        this.ui.exitBtn = document.createElement('button');
        this.ui.exitBtn.textContent = 'Exit Tutorial';
        this.ui.exitBtn.className = 'bg-red-500 text-white px-4 py-2 rounded-md text-xs hover:bg-red-600 transition-colors';
        this.ui.exitBtn.onclick = () => this.stopTutorial();
        buttonsDiv.appendChild(this.ui.exitBtn);

        this.ui.panel.appendChild(buttonsDiv);
        document.body.appendChild(this.ui.panel);

        // Highlight box
        this.ui.highlightBox = document.createElement('div');
        this.ui.highlightBox.id = 'tutorialHighlightBox';
        this.ui.highlightBox.style.cssText = `
            position: absolute; border: 3px dashed #FF4500; /* OrangeRed */
            background-color: rgba(255, 69, 0, 0.1);
            border-radius: 6px; z-index: 1000; display: none; pointer-events: none;
            transition: all 0.25s ease-in-out; box-sizing: border-box;
        `;
        document.body.appendChild(this.ui.highlightBox);
    }

    _defineAllTutorials() {
        // This is where all tutorial definitions will live.
        // Each tutorial is an array of step objects.
        // Step object properties:
        // - title: (String) Title for the tutorial step.
        // - text: (String) HTML content for instructions.
        // - highlight: (String or Array of Strings) ID(s) of HTML element(s) to highlight.
        // - onEnter: (Function, Optional) Code to run when the step starts (e.g., pre-fill inputs).
        // - condition: (Function, Optional) Returns true if user has completed the required action.
        //              If not defined, 'Next' button works immediately.
        // - actionPrompt: (String, Optional) Message if condition() is false.
        // - onExit: (Function, Optional) Code to run when the step is successfully completed and exited.
        return {
            "excellentPTV": [
                {
                    title: "Goal: Excellent PTV Coverage",
                    text: "Welcome! This tutorial guides you in creating a plan that effectively covers the <strong>PTV (Prostate)</strong> while minimizing dose to nearby <strong>OARs (Rectum, Bladder)</strong>.<br><br>First, let's ensure the PTV (Orange Dashed) is visible in the viewer.",
                    highlight: 'PTV_Prostate_overlay', // Assumes this element exists in tpsContext or DOM
                    onEnter: () => {
                        this.tps.clearBeams?.(); // Clear any existing beams from main TPS
                        this.tps.ensureStructureVisible?.('PTV_Prostate');
                        this.tps.ensureStructureVisible?.('OAR_Rectum');
                        this.tps.ensureStructureVisible?.('OAR_Bladder');
                    }
                },
                {
                    title: "Step 1: Anterior Beam (0°)",
                    text: "Let's add an <strong>Anterior beam</strong>. This beam approaches from the front.<br>Set:<br>- Gantry Angle: <strong>0°</strong><br>- Field Size X: <strong>10 cm</strong><br>- Field Size Y: <strong>12 cm</strong> (Prostate is often taller than wide)<br>- Weight: <strong>50</strong><br>Then click 'Add Beam'.",
                    highlight: ['gantryAngleInput', 'fieldSizeXInput', 'fieldSizeYInput', 'beamWeightInput', 'addBeamBtn'],
                    actionPrompt: "Set Gantry to 0°, FSX 10, FSY 12, Weight 50, then click 'Add Beam'.",
                    condition: () => this.tps.beams?.length === 1 &&
                                     this.tps.beams[0].angle === 0 &&
                                     this.tps.beams[0].sizeX === 10 &&
                                     this.tps.beams[0].sizeY === 12 &&
                                     this.tps.beams[0].weight === 50,
                    onEnter: () => {
                        this.tps.gantryAngleInput.value = 0;
                        this.tps.fieldSizeXInput.value = 10;
                        this.tps.fieldSizeYInput.value = 12;
                        this.tps.beamWeightInput.value = 50;
                    }
                },
                {
                    title: "Observe Single Beam Effects",
                    text: "Notice the <strong>DVH</strong>. The PTV (e.g., purple line) gets some dose. The <strong>Bladder</strong> (anterior OAR) also receives a high dose as it's in the beam's path. The <strong>isodose lines</strong> (green=high, yellow=medium) show this. <br><br>A single beam often gives non-uniform PTV dose and hits OARs directly.",
                    highlight: ['dvhChartCanvas', 'isodoseOverlaySVG', 'OAR_Bladder_overlay'],
                },
                {
                    title: "Step 2: Posterior Beam (180°)",
                    text: "To improve uniformity and coverage, add an opposing <strong>Posterior beam</strong>.<br>Set:<br>- Gantry Angle: <strong>180°</strong><br>- Field Size X: <strong>10 cm</strong><br>- Field Size Y: <strong>12 cm</strong><br>- Weight: <strong>50</strong><br>Then 'Add Beam'. Opposing beams help balance the dose distribution.",
                    highlight: ['gantryAngleInput', 'addBeamBtn'],
                    actionPrompt: "Set Gantry to 180°, FSX 10, FSY 12, Weight 50, then 'Add Beam'.",
                    condition: () => this.tps.beams?.length === 2 &&
                                     this.tps.beams.some(b => b.angle === 180 && b.sizeX === 10 && b.sizeY === 12 && b.weight === 50),
                    onEnter: () => {
                        this.tps.gantryAngleInput.value = 180;
                        this.tps.fieldSizeXInput.value = 10;
                        this.tps.fieldSizeYInput.value = 12;
                        this.tps.beamWeightInput.value = 50;
                    }
                },
                {
                    title: "Observe AP/PA Pair Effects",
                    text: "PTV coverage is now more uniform along the anterior-posterior axis. However, both <strong>Bladder</strong> and <strong>Rectum</strong> (posterior OAR) are in the direct path of these beams. This is better for PTV uniformity, but still not ideal for OAR sparing.",
                    highlight: ['dvhChartCanvas', 'OAR_Rectum_overlay'],
                },
                {
                    title: "Step 3: Add Lateral Beams (Box)",
                    text: "Let's add two lateral beams to create a '4-field box', a common technique for pelvic treatments.<br>1. Add a beam at Gantry <strong>90°</strong> (Right Lat). Field Size X: <strong>12cm</strong>, Y: <strong>10cm</strong>. Weight: <strong>40</strong>.<br>2. Add another at Gantry <strong>270°</strong> (Left Lat). Same settings.<br>Lateral beams often need wider X and narrower Y for prostate.",
                    highlight: ['gantryAngleInput', 'fieldSizeXInput', 'fieldSizeYInput', 'beamWeightInput', 'addBeamBtn'],
                    actionPrompt: "Add a beam at 90° (FSX 12, FSY 10, W 40), then another at 270° with same settings.",
                    condition: () => this.tps.beams?.length === 4 &&
                                     this.tps.beams.some(b => b.angle === 90 && b.sizeX === 12 && b.sizeY === 10 && b.weight === 40) &&
                                     this.tps.beams.some(b => b.angle === 270 && b.sizeX === 12 && b.sizeY === 10 && b.weight === 40),
                    onEnter: () => {
                        this.tps.gantryAngleInput.value = 90; // For the first lateral
                        this.tps.fieldSizeXInput.value = 12;
                        this.tps.fieldSizeYInput.value = 10;
                        this.tps.beamWeightInput.value = 40;
                    }
                },
                {
                    title: "Observe 4-Field Box",
                    text: "PTV coverage should be more conformal (dose shaped to target). Dose is spread out more, potentially reducing very high doses to any single OAR entrance/exit point. The <strong>Femoral Heads</strong> (lateral OARs) might now be getting some dose from the lateral beams if fields are too wide.",
                    highlight: ['dvhChartCanvas', 'OAR_FemHead_L_overlay', 'OAR_FemHead_R_overlay']
                },
                {
                    title: "Step 4: Adjust Beam Weights",
                    text: "Not all beams need equal contribution. Let's try to reduce dose to the <strong>Rectum</strong>. Select the <strong>Posterior beam (Beam 2, G:180°)</strong> from the Beam List. Reduce its Weight to <strong>25-30</strong> and click 'Apply to Selected Beam'. This lowers its impact.",
                    highlight: ['beamList', 'beamWeightInput', 'applyBeamSettingsBtn'],
                    actionPrompt: "Select Beam 2 (180°), set Weight to ~30, and Apply.",
                    condition: () => {
                        const posteriorBeam = this.tps.beams?.find(b => b.angle === 180);
                        return posteriorBeam && posteriorBeam.weight <= 30 && posteriorBeam.weight >=25;
                    },
                },
                {
                    title: "Step 5: Fine-Tune Field Sizes",
                    text: "Select each beam one by one. Adjust its <strong>Field Size X and Y</strong> to tightly conform to the PTV outline from that beam's perspective (this is the concept of Beam's Eye View - BEV). Aim to exclude OARs as much as possible from each field while still covering the PTV. For example, anterior/posterior beams might need a smaller X width for the prostate. The 'Conceptual BEV' text will update for the selected beam.",
                    highlight: ['beamList', 'fieldSizeXInput', 'fieldSizeYInput', 'applyBeamSettingsBtn', 'bevPlaceholder'],
                    actionPrompt: "Select each beam and adjust field sizes for better PTV conformity and OAR avoidance. Try to make the PTV coverage 'Excellent' in the Plan Summary.",
                    // Condition for this step is more subjective. We can check if Plan Summary PTV is good.
                    condition: () => this.tps.planSummaryPTV?.textContent.toLowerCase().includes("excellent"),
                },
                {
                    title: "Excellent Plan Achieved!",
                    text: "Great job! Observe the <strong>DVH</strong>. The PTV curve should be high and steep (good coverage). OAR curves should be relatively low (good sparing). The <strong>Plan Summary</strong> should reflect this. <br><br>Further improvements in a real TPS could involve more angled beams (IMRT/VMAT concept) or advanced computer optimization.",
                    highlight: ['dvhChartCanvas', 'planSummaryPTV', 'planSummaryOAR'],
                    onExit: () => {
                        if (typeof alert !== 'undefined') alert("Excellent Plan Tutorial Complete!");
                        else console.log("Excellent Plan Tutorial Complete!");
                     }
                }
            ],
            "suboptimalPlan": [
                {
                    title: "Demo: Suboptimal Plan",
                    text: "This tutorial will demonstrate how poor beam choices can lead to inadequate PTV coverage or excessive OAR dose. <br><br>We'll start by clearing any existing beams.",
                    highlight: 'PTV_Prostate_overlay',
                    onEnter: () => {
                        this.tps.clearBeams?.();
                        this.tps.ensureStructureVisible?.('PTV_Prostate');
                        this.tps.ensureStructureVisible?.('OAR_Rectum');
                    }
                },
                {
                    title: "Step 1: Single, Large Posterior Beam",
                    text: "Add only one beam, directly through an OAR.<br>Set:<br>- Gantry Angle: <strong>180°</strong> (Posterior)<br>- Field Size X: <strong>15 cm</strong> (Very large)<br>- Field Size Y: <strong>15 cm</strong> (Very large)<br>- Weight: <strong>80</strong><br>Then click 'Add Beam'.",
                    highlight: ['gantryAngleInput', 'fieldSizeXInput', 'fieldSizeYInput', 'beamWeightInput', 'addBeamBtn'],
                    actionPrompt: "Set Gantry to 180°, FSX 15, FSY 15, Weight 80, then 'Add Beam'.",
                    condition: () => this.tps.beams?.length === 1 &&
                                     this.tps.beams[0].angle === 180 &&
                                     this.tps.beams[0].sizeX === 15 &&
                                     this.tps.beams[0].sizeY === 15 &&
                                     this.tps.beams[0].weight === 80,
                    onEnter: () => {
                        this.tps.gantryAngleInput.value = 180;
                        this.tps.fieldSizeXInput.value = 15;
                        this.tps.fieldSizeYInput.value = 15;
                        this.tps.beamWeightInput.value = 80;
                    }
                },
                {
                    title: "Observe Poor Plan Outcome",
                    text: "Look at the <strong>DVH</strong>. The PTV might be irradiated, but the <strong>Rectum</strong> (posterior OAR) receives a very high dose, likely similar to the PTV, because the beam passes directly through it. The very large field size also unnecessarily irradiates a lot of healthy tissue. The <strong>Plan Summary</strong> should show 'Poor' OAR sparing.",
                    highlight: ['dvhChartCanvas', 'planSummaryOAR', 'OAR_Rectum_overlay', 'isodoseOverlaySVG'],
                     onExit: () => {
                        if (typeof alert !== 'undefined') alert("Suboptimal Plan Demo Complete. Note the high dose to the Rectum!");
                        else console.log("Suboptimal Plan Demo Complete. Note the high dose to the Rectum!");
                    }
                }
            ]
        };
    }

    startTutorial(tutorialName) {
        if (!this._tutorials[tutorialName]) {
            console.error("Tutorial not found:", tutorialName);
            if (typeof alert !== 'undefined') alert(`Tutorial "${tutorialName}" not found.`);
            return;
        }
        this.currentTutorialName = tutorialName;
        this.tutorialSteps = this._tutorials[tutorialName];
        this.currentStepIndex = -1; // Will be incremented by goToStep
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
        if (this.currentStepIndex < 0 || this.currentStepIndex >= this.tutorialSteps.length) {
            return;
        }
        const currentStep = this.tutorialSteps[this.currentStepIndex];
        if (currentStep.condition && !currentStep.condition()) {
            this.ui.actionRequiredText.textContent = currentStep.actionPrompt || "Please complete the current action as described.";
            this.ui.actionRequiredText.style.display = 'block';
            // Optionally, re-highlight if needed
            if (currentStep.highlight) this._highlightElement(Array.isArray(currentStep.highlight) ? currentStep.highlight[0] : currentStep.highlight);
            return;
        }
        this.ui.actionRequiredText.style.display = 'none';
        this.goToStep(this.currentStepIndex + 1);
    }

    goToStep(stepIndex) {
        // Execute onExit of the previous step (if defined and moving forward)
        if (this.currentStepIndex !== -1 && this.currentStepIndex < stepIndex && this.tutorialSteps[this.currentStepIndex]?.onExit) {
            this.tutorialSteps[this.currentStepIndex].onExit();
        }

        if (stepIndex < 0 || stepIndex >= this.tutorialSteps.length) {
            // If trying to go beyond the last step, it effectively means finishing.
            if (stepIndex >= this.tutorialSteps.length && this.tutorialSteps[this.currentStepIndex]?.onExit) {
                 this.tutorialSteps[this.currentStepIndex].onExit(); // Call onExit for the last step
            }
            this.stopTutorial();
            return;
        }

        this.currentStepIndex = stepIndex;
        const step = this.tutorialSteps[stepIndex];

        this.ui.title.textContent = step.title || `Step ${stepIndex + 1}`;
        this.ui.text.innerHTML = step.text; // Use innerHTML for formatted text

        this._removeHighlight();
        if (step.highlight) {
            const elementsToHighlight = Array.isArray(step.highlight) ? step.highlight : [step.highlight];
            elementsToHighlight.forEach(elId => this._highlightElement(elId, elementsToHighlight.length > 1));
        }

        step.onEnter?.(); // Execute onEnter of the current step

        this.ui.prevBtn.disabled = stepIndex === 0;
        this.ui.nextBtn.textContent = (stepIndex === this.tutorialSteps.length - 1) ? "Finish" : "Next";
        this.ui.actionRequiredText.style.display = 'none'; // Hide action prompt on new step
    }

    _highlightElement(elementIdOrRef, isMultiple = false) {
        // Try to get element from tpsContext first, then from DOM by ID
        const element = (this.tps && typeof this.tps[elementIdOrRef] !== 'undefined')
            ? this.tps[elementIdOrRef]
            : document.getElementById(elementIdOrRef);

        if (element) {
            // For single highlight, make it prominent. For multiple, maybe less so or just one main.
            // For simplicity, we'll just use one highlightBox. If multiple, it highlights the first one.
            // A more complex solution could create multiple highlight boxes or cycle them.
            if (!isMultiple || this.ui.highlightBox.style.display === 'none') { // Only reposition if new highlight or single
                element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                const rect = element.getBoundingClientRect();
                this.ui.highlightBox.style.left = `${rect.left + window.scrollX - 5}px`;
                this.ui.highlightBox.style.top = `${rect.top + window.scrollY - 5}px`;
                this.ui.highlightBox.style.width = `${rect.width + 10}px`;
                this.ui.highlightBox.style.height = `${rect.height + 10}px`;
                this.ui.highlightBox.style.display = 'block';
            }
        } else {
            console.warn("Tutorial highlight: Element not found -", elementIdOrRef);
            if (!isMultiple) this._removeHighlight(); // Only remove if it was meant to be the sole highlight
        }
    }

    _removeHighlight() {
        this.ui.highlightBox.style.display = 'none';
    }
}

/*
// --- Example Integration (place in your main TPS script, e.g., within DOMContentLoaded) ---

// Ensure these variables from your main TPS script are accessible to the tpsContext.
// If they are scoped locally, you might need to expose them (e.g., via window or a TPSApp object).
// For this example, let's assume they are accessible in the scope where tpsContext is created.

/*
document.addEventListener('DOMContentLoaded', () => {
    // ... (your existing Enhanced Virtual TPS setup code from previous turns) ...
    // This includes defining:
    // - ctSliceInput, ctViewerImage, viewerArea, addBeamBtn, clearBeamsBtn,
    // - gantryAngleInput, fieldSizeXInput, fieldSizeYInput, beamWeightInput,
    // - applyBeamSettingsBtn, beamList, dvhChartCanvas, isodoseOverlaySVG,
    // - planSummaryPTV, planSummaryOAR, bevPlaceholder,
    // - structures object, beams array, selectedBeamIndex,
    // - functions like updateDVH, renderBeams, updateStructureVisuals, clearBeams etc.

    const tpsContext = {
        // State variables
        get beams() { return window.beams_global_ref; }, // Assuming beams is exposed as window.beams_global_ref
        get structures() { return window.structures_global_ref; }, // Assuming structures is exposed

        // DOM Elements (ensure these IDs match your HTML)
        gantryAngleInput: document.getElementById('gantryAngle'),
        fieldSizeXInput: document.getElementById('fieldSizeX'),
        fieldSizeYInput: document.getElementById('fieldSizeY'),
        beamWeightInput: document.getElementById('beamWeight'),
        addBeamBtn: document.getElementById('addBeamBtn'),
        applyBeamSettingsBtn: document.getElementById('applyBeamSettings'),
        beamList: document.getElementById('beamList'),
        clearBeamsBtnRef: document.getElementById('clearBeamsBtn'), // Renamed to avoid conflict if clearBeams is a function
        dvhChartCanvas: document.getElementById('dvhChartCanvas'),
        isodoseOverlaySVG: document.getElementById('isodoseOverlaySVG'),
        planSummaryPTV: document.getElementById('planSummaryPTV'),
        planSummaryOAR: document.getElementById('planSummaryOAR'),
        bevPlaceholder: document.getElementById('bevPlaceholder'),

        // Structure overlays (ensure these IDs match your HTML)
        PTV_Prostate_overlay: document.getElementById('PTV_Prostate_overlay'),
        OAR_Rectum_overlay: document.getElementById('OAR_Rectum_overlay'),
        OAR_Bladder_overlay: document.getElementById('OAR_Bladder_overlay'),
        OAR_FemHead_L_overlay: document.getElementById('OAR_FemHead_L_overlay'),
        OAR_FemHead_R_overlay: document.getElementById('OAR_FemHead_R_overlay'),

        // Helper functions from your main TPS (ensure they are accessible)
        clearBeams: () => { // Example: wrap your clearBeams logic
            if (typeof window.clearBeams_global_func === 'function') {
                window.clearBeams_global_func();
            } else if (document.getElementById('clearBeamsBtn')) {
                 document.getElementById('clearBeamsBtn').click(); // Fallback to clicking button
            }
        },
        ensureStructureVisible: (structureId) => {
            // This function needs to exist in your main TPS script or be implemented here.
            // It should make the specified structure overlay visible.
            const s = window.structures_global_ref?.[structureId];
            if (s && !s.visible) {
                s.visible = true;
                window.updateStructureVisuals_global_func?.(); // Call your main TPS update function
            }
        },
        // Add any other functions or properties the tutorial might need to check or call
        // For example, to get the current selected beam:
        // getSelectedBeam: () => window.beams_global_ref[window.selectedBeamIndex_global_ref],
    };

    // Make sure your main TPS variables are actually exposed correctly for the context.
    // For example, after defining 'beams' in your main script:
    // window.beams_global_ref = beams;
    // window.structures_global_ref = structures;
    // window.clearBeams_global_func = clearBeams; // if clearBeams is a function
    // window.updateStructureVisuals_global_func = updateStructureVisuals; // if updateStructureVisuals is a function

    const tpsTutorial = new TpsTutorial(tpsContext);
    window.tpsTutorial = tpsTutorial; // Make it globally accessible for button clicks

    // Add buttons to your main UI to trigger tutorials
    const tutorialButtonContainer = document.createElement('div');
    tutorialButtonContainer.style.cssText = `
        position: fixed; top: 100px; right: 20px; z-index: 1000; display: flex; flex-direction: column; gap: 8px;
    `; // Adjusted positioning

    const goodPlanButton = document.createElement('button');
    goodPlanButton.textContent = 'Good Plan Tutorial';
    goodPlanButton.className = 'bg-green-500 text-white px-3 py-2 rounded-md text-sm shadow hover:bg-green-600 transition-colors';
    goodPlanButton.onclick = () => tpsTutorial.startTutorial('excellentPTV');
    tutorialButtonContainer.appendChild(goodPlanButton);

    const badPlanButton = document.createElement('button');
    badPlanButton.textContent = 'Suboptimal Plan Demo';
    badPlanButton.className = 'bg-orange-500 text-white px-3 py-2 rounded-md text-sm shadow hover:bg-orange-600 transition-colors';
    badPlanButton.onclick = () => tpsTutorial.startTutorial('suboptimalPlan');
    tutorialButtonContainer.appendChild(badPlanButton);

    document.body.appendChild(tutorialButtonContainer);
});
*/

