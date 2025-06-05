/**
 * integrated_tps_linac_script.js
 * Main JavaScript for the Integrated TPS & 3D LINAC Simulator
 * LINAC geometry updated based on Build-a-LINAC Game.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    // Panels
    const leftPanel = document.getElementById('left-panel');
    const viewerContainer3D = document.getElementById('viewer-container'); // 3D LINAC viewer
    const rightPanel = document.getElementById('right-panel');

    // Site Selection
    const siteSelect = document.getElementById('siteSelect');

    // 2D Viewer (in left panel)
    const ctViewer2D = document.getElementById('ct-viewer-2d');
    const ctViewerImage2D = document.getElementById('ctViewerImage2D');
    const isodoseOverlaySVG2D = document.getElementById('isodoseOverlaySVG2D');
    const ctSliceSlider = document.getElementById('ctSliceSlider');
    const ctSliceValueText = document.getElementById('ctSliceValueText');

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
    const inverseObjectivesContainer = document.getElementById('inverseObjectivesContainer');
    const simulateOptimizationBtn = document.getElementById('simulateOptimizationBtn');

    // Right Panel: Evaluation & Control
    const beamListDiv = document.getElementById('beamList');
    const dvhChartCanvasEl = document.getElementById('dvhChartCanvas');
    const planSummaryContainer = document.getElementById('planSummaryContainer');
    const applyToLinacBtn = document.getElementById('applyToLinacBtn');
    const runFullPlanBtn = document.getElementById('runFullPlanBtn');
    const approvePlanBtn = document.getElementById('approvePlanBtn');

    // LINAC Controls Panel (Bottom)
    const linacControlsPanel = document.getElementById('linac-controls-panel');
    const linacGantryRotCWBtn = document.getElementById('linacGantryRotCW');
    const linacGantryRotCCWBtn = document.getElementById('linacGantryRotCCW');
    const linacStatusDiv = document.getElementById('linac-status');
    const linacJawsOpenBtn = document.getElementById('linacJawsOpen');
    const linacJawsCloseBtn = document.getElementById('linacJawsClose');
    const linacCouchInBtn = document.getElementById('linacCouchIn');
    const linacCouchOutBtn = document.getElementById('linacCouchOut');

    // --- Three.js Variables ---
    let scene, camera3D, renderer3D, controls3D;
    let staticSetupGroup, gantryRotatingGroup, couchGroup, couchTopGroup;
    let linacParts = {}; // To store references to LINAC part meshes
    let jawX1, jawX2, jawY1, jawY2; // More descriptive jaw names
    let patientPhantomMesh, targetVolumeMesh3D;
    let beamVisualizationMesh; // Single mesh for beam vis
    let beamVisualizationGroup; // For visualizing the beam in 3D - Declare it here
    let linacHeadObject;

    // Constants from Build-a-LINAC, adjusted if necessary
    const ISOCENTER_Y_TARGET = 1.3;
    const GANTRY_PLANE_Z_TARGET = -0.8;
    const COUCH_SEPARATION_OFFSET = 3.0;
    const GROUND_Y = 0;
    const ACCORDION_GEOMETRIC_HEIGHT = 1.0;
    const WORLD_ISOCENTER = new THREE.Vector3(0, ISOCENTER_Y_TARGET, GANTRY_PLANE_Z_TARGET);

    // --- TPS State Variables ---
    let currentSite = 'prostate';
    let currentPlanningMode = 'forward';
    let tpsBeams = [];
    let selectedTpsBeamIndex = -1;
    let currentEditingStructureId2D = null;
    let ctSliceImagePaths = { prostate: [], lung: [], brain: [] };
    let allStructuresData = {};
    let currentSiteStructures = {};
    let dvhChartInstance;

    // Animation variables for LINAC
    let isLinacAnimating = false;
    let planAnimationQueue = [];
    let currentAnimationStep = 0;
    let animationFrameId;
    let currentJawOffset = 0.1;
    const MAX_JAW_OFFSET = 0.25;
    const MIN_JAW_OFFSET = 0.03;


    const DEG_TO_RAD = Math.PI / 180;
    const RAD_TO_DEG = 180 / Math.PI;

    const linacMaterials = {
        drivestand: new THREE.MeshStandardMaterial({ color: 0x9cb2bf, metalness: 0.4, roughness: 0.7 }),
        modulatorCabinet: new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.4, roughness: 0.6 }),
        klystron: new THREE.MeshStandardMaterial({ color: 0x778899, metalness: 0.3, roughness: 0.6 }),
        connectingArm: new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.5, roughness: 0.5 }),
        gantryBody: new THREE.MeshStandardMaterial({ color: 0xadd8e6, metalness: 0.5, roughness: 0.5 }),
        treatmentHead: new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.4, roughness: 0.5 }),
        jaws: new THREE.MeshStandardMaterial({ color: 0xffa500, metalness: 0.6, roughness: 0.4 }),
        couch: new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.3, roughness: 0.7 }),
        couchAccordion: new THREE.MeshStandardMaterial({ color: 0x505050 })
    };

    function defineSiteData() { // This function remains largely the same as your current run_plan.js
        allStructuresData = {
            prostate: {
                name: "Prostate Cancer",
                structures: {
                    "PTV_Prostate": { id: "PTV_Prostate", name: "PTV Prostate", type: "PTV", color: 'rgba(250, 204, 21, 0.3)', borderColor: '#facc15', x: 45, y: 55, w: 15, h: 20, shapeParams: { borderRadius: '40% 40% 30% 30%' } },
                    "OAR_Rectum":   { id: "OAR_Rectum", name: "Rectum", type: "OAR", color: 'rgba(239, 68, 68, 0.4)', borderColor: '#ef4444', x: 42, y: 70, w: 20, h: 25, shapeParams: { borderRadius: '15px 15px 35% 35%'} },
                    "OAR_Bladder":  { id: "OAR_Bladder", name: "Bladder", type: "OAR", color: 'rgba(59, 130, 246, 0.4)', borderColor: '#3b82f6', x: 48, y: 30, w: 20, h: 18, shapeParams: { borderRadius: '35% 35% 15px 15px'} },
                    "OAR_FemHead_L":{ id: "OAR_FemHead_L", name: "L Femoral Head", type: "OAR", color: 'rgba(168, 85, 247, 0.3)', borderColor: '#a855f7', x: 25, y: 50, w: 12, h: 20, shapeParams: { borderRadius: '50%'}},
                    "OAR_FemHead_R":{ id: "OAR_FemHead_R", name: "R Femoral Head", type: "OAR", color: 'rgba(168, 85, 247, 0.3)', borderColor: '#a855f7', x: 70, y: 50, w: 12, h: 20, shapeParams: { borderRadius: '50%'}}
                },
                objectives: [ // For inverse planning
                    { label: "PTV D95% (Gy):", id: "ptvD95", defaultValue: 76, type: "PTV" },
                    { label: "Rectum V70Gy (%):", id: "rectumV70", defaultValue: 20, type: "OAR", constraint: "max" },
                    { label: "Bladder V75Gy (%):", id: "bladderV75", defaultValue: 25, type: "OAR", constraint: "max" }
                ],
                planSummaryMetrics: [
                    { label: "PTV D95%", key: "PTV_Prostate", metricType: "DoseAtVolume", value: 95, target: 76, unit: "Gy" },
                    { label: "Rectum V70Gy", key: "OAR_Rectum", metricType: "VolumeAtDose", value: 70, target: 20, unit: "%" },
                    { label: "Bladder V75Gy", key: "OAR_Bladder", metricType: "VolumeAtDose", value: 75, target: 25, unit: "%" },
                ],
                defaultBeamParams: { gantry: 0, fsx: 10, fsy: 12, weight: 50 }
            },
            lung: { /* ... lung data ... */
                name: "Lung Cancer",
                structures: {
                    "PTV_Lung":         { id: "PTV_Lung", name: "PTV Lung Tumor", type: "PTV", color: 'rgba(250, 204, 21, 0.3)', borderColor: '#facc15', x: 35, y: 45, w: 20, h: 30, shapeParams: { borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%'} },
                    "OAR_Lung_L":       { id: "OAR_Lung_L", name: "Left Lung", type: "OAR", color: 'rgba(34, 197, 94, 0.3)', borderColor: '#22c55e', x: 15, y: 20, w: 30, h: 65, shapeParams: { borderRadius: '40% 10% 10% 60% / 50% 10% 10% 50%'} },
                    "OAR_Lung_R":       { id: "OAR_Lung_R", name: "Right Lung", type: "OAR", color: 'rgba(34, 197, 94, 0.3)', borderColor: '#22c55e', x: 55, y: 20, w: 30, h: 65, shapeParams: { borderRadius: '10% 40% 60% 10% / 10% 50% 50% 10%'} },
                    "OAR_SpinalCord":   { id: "OAR_SpinalCord", name: "Spinal Cord", type: "OAR", color: 'rgba(239, 68, 68, 0.4)', borderColor: '#ef4444', x: 48, y: 40, w: 4, h: 25, shapeParams: { borderRadius: '5px'} },
                    "OAR_Heart":        { id: "OAR_Heart", name: "Heart", type: "OAR", color: 'rgba(217, 70, 239, 0.3)', borderColor: '#d946ef', x: 30, y: 55, w: 25, h: 25, shapeParams: { borderRadius: '50% 50% 20% 20%'} },
                    "OAR_Esophagus":    { id: "OAR_Esophagus", name: "Esophagus", type: "OAR", color: 'rgba(245, 158, 11, 0.4)', borderColor: '#f59e0b', x: 53, y: 45, w: 3, h: 15, shapeParams: { borderRadius: '3px'} },
                    "LANDMARK_Carina":  { id: "LANDMARK_Carina", name: "Carina", type: "LANDMARK", color: 'rgba(139, 92, 246, 0.25)', borderColor: '#8b5cf6', x: 47, y: 30, w: 6, h: 5, shapeParams: { borderRadius: '40% 40% 20% 20%'} },
                    "LANDMARK_T4T5":    { id: "LANDMARK_T4T5", name: "T4/T5 Vertebra", type: "LANDMARK", color: 'rgba(139, 92, 246, 0.35)', borderColor: '#8b5cf6', x: 47.5, y: 32, w: 5, h: 8, shapeParams: { borderRadius: '3px'} }
                },
                objectives: [
                    { label: "PTV D95% (Gy):", id: "ptvD95_lung", defaultValue: 60, type: "PTV" },
                    { label: "Cord Max (Gy):", id: "cordMax_lung", defaultValue: 45, type: "OAR", constraint: "max" },
                    { label: "Lung V20Gy (%):", id: "lungV20_lung", defaultValue: 30, type: "OAR", constraint: "max" },
                    { label: "Heart Mean (Gy):", id: "heartMean_lung", defaultValue: 26, type: "OAR", constraint: "max" }
                ],
                planSummaryMetrics: [
                    { label: "PTV D95%", key: "PTV_Lung", metricType: "DoseAtVolume", value: 95, target: 60, unit: "Gy" },
                    { label: "Cord Max", key: "OAR_SpinalCord", metricType: "MaxDose", target: 45, unit: "Gy" },
                    { label: "Lung V20Gy", key: "OAR_Lung_Total", metricType: "VolumeAtDose", value: 20, target: 30, unit: "%" },
                    { label: "Heart Mean", key: "OAR_Heart", metricType: "MeanDose", target: 26, unit: "Gy" },
                ],
                defaultBeamParams: { gantry: 0, fsx: 8, fsy: 10, weight: 50 }
            },
            brain: { /* ... brain data ... */
                name: "Whole Brain",
                structures: {
                    "PTV_WholeBrain":   { id: "PTV_WholeBrain", name: "PTV Whole Brain", type: "PTV", color: 'rgba(253, 224, 71, 0.3)', borderColor: '#fde047', x: 15, y: 10, w: 70, h: 80, shapeParams: { borderRadius: '45% 45% 35% 35% / 50% 50% 40% 40%' } },
                    "OAR_Eye_L":        { id: "OAR_Eye_L", name: "Eye Left", type: "OAR", color: 'rgba(59, 130, 246, 0.4)', borderColor: '#3b82f6', x: 25, y: 38, w: 10, h: 8, shapeParams: { borderRadius: '50%' } },
                    "OAR_Eye_R":        { id: "OAR_Eye_R", name: "Eye Right", type: "OAR", color: 'rgba(59, 130, 246, 0.4)', borderColor: '#3b82f6', x: 65, y: 38, w: 10, h: 8, shapeParams: { borderRadius: '50%' } },
                    "OAR_Lens_L":       { id: "OAR_Lens_L", name: "Lens Left", type: "OAR", color: 'rgba(16, 185, 129, 0.5)', borderColor: '#10b981', x: 27, y: 40, w: 4, h: 3, shapeParams: { borderRadius: '50%' } },
                    "OAR_Lens_R":       { id: "OAR_Lens_R", name: "Lens Right", type: "OAR", color: 'rgba(16, 185, 129, 0.5)', borderColor: '#10b981', x: 69, y: 40, w: 4, h: 3, shapeParams: { borderRadius: '50%' } },
                    "OAR_OpticNerve_L": { id: "OAR_OpticNerve_L", name: "Optic Nerve L", type: "OAR", color: 'rgba(236, 72, 153, 0.4)', borderColor: '#ec4899', x: 35, y: 42, w: 10, h: 3, shapeParams: { borderRadius: '3px', transform: 'rotate(-10deg)' } },
                    "OAR_OpticNerve_R": { id: "OAR_OpticNerve_R", name: "Optic Nerve R", type: "OAR", color: 'rgba(236, 72, 153, 0.4)', borderColor: '#ec4899', x: 55, y: 42, w: 10, h: 3, shapeParams: { borderRadius: '3px', transform: 'rotate(10deg)' } },
                    "OAR_OpticChiasm":  { id: "OAR_OpticChiasm", name: "Optic Chiasm", type: "OAR", color: 'rgba(240, 82, 82, 0.4)', borderColor: '#f05252', x: 46, y: 46, w: 8, h: 4, shapeParams: { borderRadius: '20%' } },
                    "OAR_Brainstem":    { id: "OAR_Brainstem", name: "Brainstem", type: "OAR", color: 'rgba(239, 68, 68, 0.5)', borderColor: '#ef4444', x: 45, y: 55, w: 10, h: 25, shapeParams: { borderRadius: '10px 10px 25px 25px' } }
                },
                objectives: [
                    { label: "PTV D95% (Gy):", id: "ptvD95_wb", defaultValue: 30, type: "PTV" },
                    { label: "Lens Max (Gy):", id: "lensMax_wb", defaultValue: 7, type: "OAR", constraint: "max" },
                    { label: "Eye Max (Gy):", id: "eyeMax_wb", defaultValue: 15, type: "OAR", constraint: "max" },
                    { label: "Brainstem Max (Gy):", id: "brainstemMax_wb", defaultValue: 30, type: "OAR", constraint: "max" },
                    { label: "Chiasm Max (Gy):", id: "chiasmMax_wb", defaultValue: 30, type: "OAR", constraint: "max" }
                ],
                planSummaryMetrics: [
                    { label: "PTV D95%", key: "PTV_WholeBrain", metricType: "DoseAtVolume", value: 95, target: 30, unit: "Gy" },
                    { label: "Lens Max", key: "OAR_Lens_L", metricType: "MaxDose", target: 7, unit: "Gy" },
                    { label: "Eye Max", key: "OAR_Eye_L", metricType: "MaxDose", target: 15, unit: "Gy" },
                    { label: "Brainstem Max", key: "OAR_Brainstem", metricType: "MaxDose", target: 30, unit: "Gy" },
                ],
                defaultBeamParams: { gantry: 90, fsx: 16, fsy: 20, weight: 50 }
            }
        };
        currentSiteStructures = JSON.parse(JSON.stringify(allStructuresData[currentSite].structures));
    }

    // --- Three.js Initialization and LINAC Model ---
    function initThreeJS() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1f2937);

        camera3D = new THREE.PerspectiveCamera(45, viewerContainer3D.clientWidth / viewerContainer3D.clientHeight, 0.1, 150);
        camera3D.position.set(7, ISOCENTER_Y_TARGET + 2.5, COUCH_SEPARATION_OFFSET + 6);

        renderer3D = new THREE.WebGLRenderer({ antialias: true });
        renderer3D.setSize(viewerContainer3D.clientWidth, viewerContainer3D.clientHeight);
        renderer3D.shadowMap.enabled = true;
        viewerContainer3D.appendChild(renderer3D.domElement);

        controls3D = new OrbitControls(camera3D, renderer3D.domElement);
        controls3D.target.set(WORLD_ISOCENTER.x, WORLD_ISOCENTER.y, GANTRY_PLANE_Z_TARGET + COUCH_SEPARATION_OFFSET / 2.5);
        controls3D.enableDamping = true;
        controls3D.maxPolarAngle = Math.PI / 2 - 0.05;
        controls3D.minDistance = 3;
        controls3D.maxDistance = 30;
        controls3D.update();

        const ambientLight = new THREE.AmbientLight(0x707070, 1.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
        directionalLight.position.set(10, 20, 15);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -15;
        directionalLight.shadow.camera.right = 15;
        directionalLight.shadow.camera.top = 15;
        directionalLight.shadow.camera.bottom = -15;
        scene.add(directionalLight);

        const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({ color: 0x374151, side: THREE.DoubleSide }));
        groundPlane.rotation.x = -Math.PI / 2;
        groundPlane.position.y = GROUND_Y;
        groundPlane.receiveShadow = true;
        scene.add(groundPlane);

        staticSetupGroup = new THREE.Group();
        staticSetupGroup.position.set(WORLD_ISOCENTER.x, GROUND_Y, GANTRY_PLANE_Z_TARGET);
        scene.add(staticSetupGroup);

        gantryRotatingGroup = new THREE.Group();
        gantryRotatingGroup.position.set(0, ISOCENTER_Y_TARGET - GROUND_Y, 0);
        staticSetupGroup.add(gantryRotatingGroup);

        const couchBaseHeight = 0.7;
        couchGroup = new THREE.Group();
        couchGroup.position.set(WORLD_ISOCENTER.x, GROUND_Y + couchBaseHeight / 2, GANTRY_PLANE_Z_TARGET + COUCH_SEPARATION_OFFSET);
        scene.add(couchGroup);

        couchTopGroup = new THREE.Group();
        couchTopGroup.position.y = couchBaseHeight / 2 + 0.15 / 2;
        couchGroup.add(couchTopGroup);

        // Corrected: Instantiate beamVisualizationGroup before adding to scene
        beamVisualizationGroup = new THREE.Group();
        scene.add(beamVisualizationGroup);


        buildFullLinacModel();
        createPatientPhantom3D();

        window.addEventListener('resize', onWindowResize3D, false);
        animate3D();
    }

    function buildFullLinacModel() {
        const linacPartsDefinitions = [
            { id: 'drivestand', type: 'box', size: [0.8, ISOCENTER_Y_TARGET + 0.3 - GROUND_Y, 0.8], pos: [0, (ISOCENTER_Y_TARGET + 0.3 - GROUND_Y) / 2, -(0.4 + 0.8 / 2)], rot: [0, 0, 0], mat: 'drivestand', group: staticSetupGroup },
            { id: 'modulatorCabinet', type: 'box', size: [0.7, 1.2, 0.5], pos: [1.2, (1.2/2) + GROUND_Y, GANTRY_PLANE_Z_TARGET -1.0], rot: [0,0,0], mat: 'modulatorCabinet', group: scene},
            { id: 'klystron', type: 'cylinder', size: [0.2, 0.2, 0.6, 16], pos: [0, (ISOCENTER_Y_TARGET + 0.3 - GROUND_Y - 0.6/2) - 0.3 , -(0.4 + 0.8/2)], rot: [0,0,0], mat: 'klystron', group: staticSetupGroup, parentKey: 'drivestand'},
            { id: 'connectingArm', type: 'box', size: [0.3, 0.3, 0.4], pos: [0, ISOCENTER_Y_TARGET - GROUND_Y, -0.4 / 2], rot: [0,0,0], mat: 'connectingArm', group: staticSetupGroup },
            { id: 'verticalArm', type: 'box', size: [0.4, 1.6, 0.4], pos: [0,0,0], rot: [0,0,0], mat: 'gantryBody', group: gantryRotatingGroup },
            { id: 'acceleratorHousing', type: 'box', size: [0.5, 0.5, 2.0], pos: [0, 0, 1.0], rot: [0,0,0], mat: 'gantryBody', group: gantryRotatingGroup, parentKey: 'verticalArm'},
            { id: 'electronGun', type: 'cylinder', size: [0.1, 0.08, 0.3, 16], pos: [0,0, -2.0/2 + 0.05 + 0.3/2], rot: [Math.PI/2,0,0], mat: 'treatmentHead', group: gantryRotatingGroup, parentKey: 'acceleratorHousing'},
            { id: 'waveguide', type: 'cylinder', size: [0.05, 0.05, 1.6, 16], pos: [0,0, -2.0/2 + 0.3 + 1.6/2 + 0.05], rot: [Math.PI/2,0,0], mat: 'treatmentHead', group: gantryRotatingGroup, parentKey: 'acceleratorHousing'},
            { id: 'bendingMagnet', type: 'box', size: [0.4,0.4,0.3], pos: [0,0, 2.0/2 - 0.3/2 + 0.05], rot: [0,0,0], mat: 'gantryBody', group: gantryRotatingGroup, parentKey: 'acceleratorHousing'},
            { id: 'treatmentHead', type: 'box', size: [0.6, 0.6, 0.8], pos: [0,0, 2.0/2 + 0.3 + 0.8/2 -0.1], rot: [0,0,0], mat: 'treatmentHead', group: gantryRotatingGroup, parentKey: 'verticalArm'},
        ];

        linacPartsDefinitions.forEach(partDef => {
            let geometry;
            if (partDef.type === 'box') geometry = new THREE.BoxGeometry(...partDef.size);
            else if (partDef.type === 'cylinder') geometry = new THREE.CylinderGeometry(partDef.size[0], partDef.size[1], partDef.size[2], partDef.size[3] || 16);
            else geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

            const material = linacMaterials[partDef.mat] || new THREE.MeshStandardMaterial({color: 0xaaaaaa});
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...partDef.pos);
            mesh.rotation.set(partDef.rot[0], partDef.rot[1], partDef.rot[2]);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.name = partDef.id;

            if (partDef.parentKey && linacParts[partDef.parentKey]) {
                linacParts[partDef.parentKey].add(mesh);
            } else {
                partDef.group.add(mesh);
            }
            linacParts[partDef.id] = mesh;
        });

        linacHeadObject = linacParts['treatmentHead'];
        createDetailedJaws3D();
        createDetailedCouch3D();
    }

    function createDetailedJaws3D() { /* ... same as previous correct version ... */
        if (!linacHeadObject) return;
        const jawMaterial = linacMaterials.jaws;
        const jawThickness = 0.05;
        const jawDepth = 0.25;
        const jawSpan = 0.6;
        jawY1 = new THREE.Mesh(new THREE.BoxGeometry(jawSpan, jawThickness, jawDepth), jawMaterial);
        jawY2 = new THREE.Mesh(new THREE.BoxGeometry(jawSpan, jawThickness, jawDepth), jawMaterial);
        jawX1 = new THREE.Mesh(new THREE.BoxGeometry(jawThickness, jawSpan, jawDepth), jawMaterial);
        jawX2 = new THREE.Mesh(new THREE.BoxGeometry(jawThickness, jawSpan, jawDepth), jawMaterial);
        const beamExitOffsetZ = - (linacHeadObject.geometry.parameters.depth / 2) - (jawDepth / 2) + 0.02;
        jawY1.position.set(0, 0.1, beamExitOffsetZ);
        jawY2.position.set(0, -0.1, beamExitOffsetZ);
        jawX1.position.set(-0.1, 0, beamExitOffsetZ + jawDepth/2 + jawThickness/2);
        jawX2.position.set(0.1, 0, beamExitOffsetZ + jawDepth/2 + jawThickness/2);
        [jawX1, jawX2, jawY1, jawY2].forEach(jaw => { jaw.castShadow = true; linacHeadObject.add(jaw); });
        updateJawPositions3D(currentJawOffset, currentJawOffset);
    }

    function updateJawPositions3D(xOffset, yOffset) { /* ... same as previous correct version ... */
        currentJawOffset = Math.max(MIN_JAW_OFFSET, Math.min(MAX_JAW_OFFSET, xOffset));
        const currentYJawOffset = Math.max(MIN_JAW_OFFSET, Math.min(MAX_JAW_OFFSET, yOffset));
        if (jawX1) jawX1.position.x = -currentJawOffset;
        if (jawX2) jawX2.position.x = currentJawOffset;
        if (jawY1) jawY1.position.y = currentYJawOffset;
        if (jawY2) jawY2.position.y = -currentYJawOffset;
    }

    function createDetailedCouch3D() { /* ... same as previous correct version ... */
        const couchWidth = 0.8, couchPlatformHeight = 0.15, couchLength = 2.8, couchBaseHeight = 0.7;
        const couchPlatformGeo = new THREE.BoxGeometry(couchWidth, couchPlatformHeight, couchLength);
        const couchPlatformMesh = new THREE.Mesh(couchPlatformGeo, linacMaterials.couch);
        couchPlatformMesh.castShadow = true; couchPlatformMesh.receiveShadow = true;
        couchTopGroup.add(couchPlatformMesh);
        const couchSupportBaseGeo = new THREE.BoxGeometry(couchWidth * 0.8, couchBaseHeight, couchLength * 0.5);
        const couchSupportBaseMesh = new THREE.Mesh(couchSupportBaseGeo, linacMaterials.couch);
        couchSupportBaseMesh.castShadow = true; couchSupportBaseMesh.receiveShadow = true;
        couchGroup.add(couchSupportBaseMesh);
        const couchAccordionVisualGeo = new THREE.BoxGeometry(couchWidth * 0.7, ACCORDION_GEOMETRIC_HEIGHT, couchLength * 0.4);
        const couchAccordionVisualMesh = new THREE.Mesh(couchAccordionVisualGeo, linacMaterials.couchAccordion);
        couchAccordionVisualMesh.name = "couchAccordionVisual"; couchAccordionVisualMesh.castShadow = true;
        couchGroup.add(couchAccordionVisualMesh);
        updateCouchAccordionVisual();
    }

    function updateCouchAccordionVisual() { /* ... same as previous correct version ... */
        const accordionVisual = couchGroup.getObjectByName("couchAccordionVisual");
        if (!accordionVisual || !couchGroup) return;
        const couchBaseHeight = 0.7;
        const couchBaseBottomWorldY = couchGroup.position.y - (couchBaseHeight / 2);
        const accordionVisibleHeight = Math.max(0.01, couchBaseBottomWorldY - GROUND_Y);
        accordionVisual.scale.y = accordionVisibleHeight / ACCORDION_GEOMETRIC_HEIGHT;
        accordionVisual.position.y = -(couchBaseHeight / 2) + (accordionVisibleHeight / 2);
    }

    function createPatientPhantom3D() { /* ... same as previous correct version ... */
        const patientGeo = new THREE.CapsuleGeometry(0.3, 1.2, 4, 12);
        const patientMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, transparent: true, opacity: 0.3, depthWrite: false });
        patientPhantomMesh = new THREE.Mesh(patientGeo, patientMat);
        patientPhantomMesh.rotation.x = Math.PI / 2;
        patientPhantomMesh.position.set(0, 0.15 / 2 + 0.3, 0);
        couchTopGroup.add(patientPhantomMesh);
        const targetGeo = new THREE.SphereGeometry(0.1, 16, 16);
        const targetMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x550000, transparent: true, opacity: 0.6 });
        targetVolumeMesh3D = new THREE.Mesh(targetGeo, targetMat);
        targetVolumeMesh3D.position.set(0, 0, 0);
        patientPhantomMesh.add(targetVolumeMesh3D);
        targetVolumeMesh3D.visible = false;
    }

    function update3DLINACVisuals(gantryAngleDeg, fieldSizeXCm, fieldSizeYCm, couchZCm = 0) { /* ... same as previous correct version ... */
        if (gantryRotatingGroup) {
            gantryRotatingGroup.rotation.y = gantryAngleDeg * DEG_TO_RAD;
        }
        const scaleFactor = 0.01;
        updateJawPositions3D(fieldSizeXCm * scaleFactor / 2, fieldSizeYCm * scaleFactor / 2);
        if (couchTopGroup) {
            couchTopGroup.position.z = (couchZCm * scaleFactor * 10);
        }
        update3DBeamVisualization(fieldSizeXCm, fieldSizeYCm);
    }

    function update3DBeamVisualization(fsxCm, fsyCm) { /* ... same as previous correct version, ensuring beamVisualizationMesh is used ... */
        if (beamVisualizationMesh) {
            linacHeadObject.remove(beamVisualizationMesh);
            beamVisualizationMesh.geometry.dispose();
            beamVisualizationMesh.material.dispose();
            beamVisualizationMesh = null; // Explicitly nullify
        }
        if (!linacHeadObject || (fsxCm === 0 && fsyCm === 0) || !isLinacAnimating) {
            return;
        }
        const beamLength = 3.0;
        const scaleFactor = 0.01;
        const beamGeometry = new THREE.BoxGeometry(fsxCm * scaleFactor, fsyCm * scaleFactor, beamLength);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00, transparent: true, opacity: 0.25, depthWrite: false
        });
        beamVisualizationMesh = new THREE.Mesh(beamGeometry, beamMaterial);
        const headDepth = linacParts['treatmentHead'] ? linacParts['treatmentHead'].geometry.parameters.depth : 0.8;
        const jawDepth = 0.25;
        beamVisualizationMesh.position.set(0, 0, - (headDepth / 2) - (jawDepth) - (beamLength / 2) + 0.05);
        linacHeadObject.add(beamVisualizationMesh);
    }

    function onWindowResize3D() { /* ... same as previous ... */
        if (camera3D && renderer3D && viewerContainer3D) {
            camera3D.aspect = viewerContainer3D.clientWidth / viewerContainer3D.clientHeight;
            camera3D.updateProjectionMatrix();
            renderer3D.setSize(viewerContainer3D.clientWidth, viewerContainer3D.clientHeight);
        }
    }

    function animate3D() { /* ... same as previous correct version ... */
        animationFrameId = requestAnimationFrame(animate3D);
        if (controls3D) controls3D.update();
        if (isLinacAnimating && planAnimationQueue.length > 0) {
            const targetState = planAnimationQueue[currentAnimationStep];
            let reachedTargetGantry = true; let reachedTargetJaws = true;
            if (gantryRotatingGroup) {
                const currentGantryRad = gantryRotatingGroup.rotation.y;
                const targetGantryRad = targetState.angle * DEG_TO_RAD;
                let diff = targetGantryRad - currentGantryRad;
                if (Math.abs(diff) > Math.PI) diff -= Math.sign(diff) * 2 * Math.PI;
                const step = 0.02;
                if (Math.abs(diff) > step) { gantryRotatingGroup.rotation.y += Math.sign(diff) * step; gantryRotatingGroup.rotation.y = (gantryRotatingGroup.rotation.y + 2 * Math.PI) % (2 * Math.PI); reachedTargetGantry = false; }
                else { gantryRotatingGroup.rotation.y = targetGantryRad; }
            }
            const scaleFactor = 0.01;
            const targetJawXHalfOpen = targetState.sizeX * scaleFactor / 2;
            const targetJawYHalfOpen = targetState.sizeY * scaleFactor / 2;
            const jawAnimStep = 0.002;
            if(jawX1 && Math.abs(-targetJawXHalfOpen - jawX1.position.x) > jawAnimStep) { jawX1.position.x += Math.sign(-targetJawXHalfOpen - jawX1.position.x) * jawAnimStep; reachedTargetJaws = false;} else if(jawX1) {jawX1.position.x = -targetJawXHalfOpen;}
            if(jawX2 && Math.abs(targetJawXHalfOpen - jawX2.position.x) > jawAnimStep) { jawX2.position.x += Math.sign(targetJawXHalfOpen - jawX2.position.x) * jawAnimStep; reachedTargetJaws = false;} else if(jawX2) {jawX2.position.x = targetJawXHalfOpen;}
            if(jawY1 && Math.abs(targetJawYHalfOpen - jawY1.position.y) > jawAnimStep) { jawY1.position.y += Math.sign(targetJawYHalfOpen - jawY1.position.y) * jawAnimStep; reachedTargetJaws = false;} else if(jawY1) {jawY1.position.y = targetJawYHalfOpen;}
            if(jawY2 && Math.abs(-targetJawYHalfOpen - jawY2.position.y) > jawAnimStep) { jawY2.position.y += Math.sign(-targetJawYHalfOpen - jawY2.position.y) * jawAnimStep; reachedTargetJaws = false;} else if(jawY2) {jawY2.position.y = -targetJawYHalfOpen;}
            update3DBeamVisualization(targetState.sizeX, targetState.sizeY);
            if (reachedTargetGantry && reachedTargetJaws) {
                linacStatusDiv.textContent = `Beam ${currentAnimationStep + 1} Delivered. Weight: ${targetState.weight}`;
                currentAnimationStep++;
                if (currentAnimationStep >= planAnimationQueue.length) {
                    isLinacAnimating = false; planAnimationQueue = []; currentAnimationStep = 0;
                    linacStatusDiv.textContent = "Plan Complete. LINAC Idle.";
                    update3DBeamVisualization(0,0);
                } else { linacStatusDiv.textContent = `Moving to Beam ${currentAnimationStep + 1}...`; }
            } else { linacStatusDiv.textContent = `Delivering Beam ${currentAnimationStep + 1} (G:${Math.round(gantryRotatingGroup.rotation.y * RAD_TO_DEG)}°)...`; }
        }
        if (renderer3D && scene && camera3D) renderer3D.render(scene, camera3D);
    }

    // --- TPS Functions (initializeSite, etc.) ---
    // These functions are largely the same as your `run_plan.js`.
    // Ensure they correctly use `allStructuresData` and `currentSiteStructures`.
    // For brevity, only showing initializeSite and the stubs for others.
    function initializeSite(siteId) { /* ... same as your run_plan.js ... */
        currentSite = siteId;
        const siteData = allStructuresData[currentSite];
        if (!siteData) { console.error("Site data not found for:", siteId); return; }
        ctSliceImagePaths[currentSite] = Array.from({ length: 50 }, (_, i) => `https://placehold.co/300x200/111827/4b5563?text=${siteData.name.split(" ")[0]}+S${i + 1}`);
        ctSliceSlider.value = 25; ctSliceValueText.textContent = "25";
        ctViewerImage2D.src = ctSliceImagePaths[currentSite][24];
        ctViewerImage2D.alt = `${siteData.name} CT Slice`;
        currentSiteStructures = JSON.parse(JSON.stringify(siteData.structures));
        structureSelector.innerHTML = '';
        ctViewer2D.querySelectorAll('.structure-overlay-2d').forEach(el => el.remove());
        Object.values(currentSiteStructures).forEach(s => {
            const option = document.createElement('option'); option.value = s.id; option.textContent = s.name;
            structureSelector.appendChild(option);
            const overlayDiv = document.createElement('div');
            overlayDiv.id = `${s.id}_overlay2D`;
            overlayDiv.className = 'structure-overlay structure-overlay-2d';
            overlayDiv.classList.add(s.type === "PTV" ? 'ptv-overlay' : (s.type === "OAR" ? 'oar-overlay' : 'landmark-overlay'));
            overlayDiv.textContent = s.name.split(" ")[0];
            overlayDiv.style.cssText = `left:${s.x}%; top:${s.y}%; width:${s.w}%; height:${s.h}%; border-color:${s.borderColor}; background-color:${s.color}; border-radius:${s.shapeParams?.borderRadius || '0px'}; transform:${s.shapeParams?.transform || 'none'}; display:${s.visible ? 'flex' : 'none'};`;
            s.element2D = overlayDiv;
            ctViewer2D.appendChild(overlayDiv);
        });
        if (structureSelector.options.length > 0) currentEditingStructureId2D = structureSelector.options[0].value;
        inverseObjectivesContainer.innerHTML = '';
        siteData.objectives.forEach(obj => {
            const div = document.createElement('div'); div.className = "mb-1";
            const labelEl = document.createElement('label'); labelEl.textContent = obj.label; labelEl.className = "text-xs mr-1";
            const inputEl = document.createElement('input'); inputEl.type = "number"; inputEl.id = obj.id; inputEl.value = obj.defaultValue; inputEl.className = "input-sm w-20 inline";
            div.appendChild(labelEl); div.appendChild(inputEl);
            inverseObjectivesContainer.appendChild(div);
        });
        planSummaryContainer.innerHTML = '';
        siteData.planSummaryMetrics.forEach(metric => {
            const p = document.createElement('p');
            p.innerHTML = `${metric.label}: <span id="summary_${metric.key.replace(/\s+/g, '_')}" class="font-semibold text-gray-500">N/A</span>`;
            planSummaryContainer.appendChild(p);
        });
        const defaultParams = siteData.defaultBeamParams;
        gantryAngleInput.value = defaultParams.gantry;
        fieldSizeXInput.value = defaultParams.fsx;
        fieldSizeYInput.value = defaultParams.fsy;
        beamWeightInput.value = defaultParams.weight;
        clearBeams(); updateDVH(); drawSimulatedIsodose2D(); update3DPatientAndTarget();
        switchPlanningModeUI(currentPlanningMode);
    }
    function update2DStructureVisuals() { /* ... from your run_plan.js ... */
        Object.values(currentSiteStructures).forEach(s => {
            if (s.element2D) {
                s.element2D.style.display = s.visible ? 'flex' : 'none';
                s.element2D.style.left = `${s.x}%`;
                s.element2D.style.top = `${s.y}%`;
                s.element2D.style.width = `${s.w}%`;
                s.element2D.style.height = `${s.h}%`;
                if (s.shapeParams?.borderRadius) s.element2D.style.borderRadius = s.shapeParams.borderRadius;
                if (s.shapeParams?.transform) s.element2D.style.transform = s.shapeParams.transform;
            }
        });
    }
    structureSelector.addEventListener('change', () => { /* ... from your run_plan.js ... */
        currentEditingStructureId2D = structureSelector.value;
        if (!structureEditorDiv.classList.contains('hidden') && currentSiteStructures[currentEditingStructureId2D]) {
            const s = currentSiteStructures[currentEditingStructureId2D];
            editingStructureNameSpan.textContent = s.name;
            structureSliders.forEach(slider => {
                const param = slider.dataset.param;
                slider.value = s[param];
                slider.nextElementSibling.textContent = s[param];
            });
        }
    });
    toggleStructureVisibilityBtn.addEventListener('click', () => { /* ... from your run_plan.js ... */
        const selectedId = structureSelector.value;
        if (currentSiteStructures[selectedId]) {
            currentSiteStructures[selectedId].visible = !currentSiteStructures[selectedId].visible;
            update2DStructureVisuals();
            updateDVH();
        }
    });
    editStructureBtn.addEventListener('click', () => { /* ... from your run_plan.js ... */
        currentEditingStructureId2D = structureSelector.value;
        const s = currentSiteStructures[currentEditingStructureId2D];
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
        }
    });
    structureSliders.forEach(slider => { /* ... from your run_plan.js ... */
        slider.addEventListener('input', (e) => {
            if (currentEditingStructureId2D && currentSiteStructures[currentEditingStructureId2D]) {
                const param = e.target.dataset.param;
                const value = parseInt(e.target.value);
                currentSiteStructures[currentEditingStructureId2D][param] = value;
                e.target.nextElementSibling.textContent = value;
                update2DStructureVisuals();
                updateDVH();
                drawSimulatedIsodose2D();
            }
        });
    });
    ctSliceSlider.addEventListener('input', () => { /* ... from your run_plan.js ... */
        const sliceNum = parseInt(ctSliceSlider.value);
        ctSliceValueText.textContent = sliceNum;
        if (ctSliceImagePaths[currentSite] && ctSliceImagePaths[currentSite][sliceNum - 1]) {
            ctViewerImage2D.src = ctSliceImagePaths[currentSite][sliceNum - 1];
        }
        Object.values(currentSiteStructures).forEach(s => {
            if (s.element2D) {
                s.element2D.style.transform = `translateY(${(sliceNum - 25) * 0.08}%) ${s.shapeParams?.transform || ''}`;
            }
        });
        drawSimulatedIsodose2D();
    });
    function switchPlanningModeUI(mode) { /* ... from your run_plan.js ... */
        currentPlanningMode = mode;
        const siteData = allStructuresData[currentSite];
        if (!siteData) return;
        if (mode === 'forward') {
            tabForwardPlanning.classList.add('active'); tabInversePlanning.classList.remove('active');
            forwardPlanningTabContent.classList.remove('hidden'); inversePlanningTabContent.classList.add('hidden');
            planTypeText.textContent = `Current Mode: Forward (${siteData.name === "Whole Brain" ? "POP" : "Static"})`;
            gantryAngleInput.value = siteData.defaultBeamParams.gantry; fieldSizeXInput.value = siteData.defaultBeamParams.fsx;
            fieldSizeYInput.value = siteData.defaultBeamParams.fsy; beamWeightInput.value = siteData.defaultBeamParams.weight;
        } else {
            tabForwardPlanning.classList.remove('active'); tabInversePlanning.classList.add('active');
            forwardPlanningTabContent.classList.add('hidden'); inversePlanningTabContent.classList.remove('hidden');
            planTypeText.textContent = `Current Mode: Inverse (${siteData.name === "Whole Brain" ? "Arc" : "IMRT"} Concept)`;
        }
        clearBeams();
    }
    addBeamBtn.addEventListener('click', () => { /* ... from your run_plan.js ... */
        if (currentPlanningMode !== 'forward') return;
        tpsBeams.push({ angle: parseInt(gantryAngleInput.value), sizeX: parseInt(fieldSizeXInput.value), sizeY: parseInt(fieldSizeYInput.value), weight: parseInt(beamWeightInput.value) });
        selectedTpsBeamIndex = tpsBeams.length - 1; renderTpsBeams();
    });
    applyBeamSettingsBtn.addEventListener('click', () => { /* ... from your run_plan.js ... */
        if (currentPlanningMode !== 'forward' || selectedTpsBeamIndex === -1 || !tpsBeams[selectedTpsBeamIndex]) { if (typeof alert !== 'undefined') alert('Please select a beam in Forward Planning mode.'); return; }
        tpsBeams[selectedTpsBeamIndex].angle = parseInt(gantryAngleInput.value); tpsBeams[selectedTpsBeamIndex].sizeX = parseInt(fieldSizeXInput.value);
        tpsBeams[selectedTpsBeamIndex].sizeY = parseInt(fieldSizeYInput.value); tpsBeams[selectedTpsBeamIndex].weight = parseInt(beamWeightInput.value);
        renderTpsBeams();
    });
    clearBeamsBtn.addEventListener('click', clearBeams);
    function clearBeams() { /* ... from your run_plan.js ... */ tpsBeams = []; selectedTpsBeamIndex = -1; renderTpsBeams(); }
    function renderTpsBeams() { /* ... from your run_plan.js ... */
        updateTpsBeamListDisplay(); updateDVH(); drawSimulatedIsodose2D();
        if (selectedTpsBeamIndex !== -1 && tpsBeams[selectedTpsBeamIndex]) {
            const beam = tpsBeams[selectedTpsBeamIndex];
            gantryAngleInput.value = beam.angle; fieldSizeXInput.value = beam.sizeX;
            fieldSizeYInput.value = beam.sizeY; beamWeightInput.value = beam.weight;
        }
    }
    function updateTpsBeamListDisplay() { /* ... from your run_plan.js ... */
        beamListDiv.innerHTML = '';
        if (currentPlanningMode === 'forward' && tpsBeams.length > 0) {
            tpsBeams.forEach((beam, index) => {
                const item = document.createElement('div');
                item.className = `flex justify-between items-center p-1 rounded cursor-pointer ${index === selectedTpsBeamIndex ? 'bg-indigo-200' : 'bg-slate-100'}`;
                item.innerHTML = `<span>B${index + 1} (G:${beam.angle}°, FS:${beam.sizeX}x${beam.sizeY}, W:${beam.weight})</span><button class="text-red-500 text-xs delete-beam hover:font-bold" data-index="${index}">X</button>`;
                item.addEventListener('click', (e) => { if (!e.target.classList.contains('delete-beam')) { selectedTpsBeamIndex = index; renderTpsBeams(); } });
                beamListDiv.appendChild(item);
            });
            beamListDiv.querySelectorAll('.delete-beam').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); const indexToDelete = parseInt(e.target.dataset.index); tpsBeams.splice(indexToDelete, 1);
                    if (selectedTpsBeamIndex === indexToDelete) selectedTpsBeamIndex = -1; else if (selectedTpsBeamIndex > indexToDelete) selectedTpsBeamIndex--;
                    renderTpsBeams();
                });
            });
        } else if (currentPlanningMode === 'inverse' && tpsBeams.length > 0) {
            const planType = allStructuresData[currentSite]?.name === "Whole Brain" ? "Arc" : "IMRT";
            beamListDiv.innerHTML = `<div class="p-1 bg-slate-100 rounded text-center">Simulated ${planType} Plan Active (${tpsBeams.length} conceptual segments/beams)</div>`;
        } else { beamListDiv.innerHTML = '<div class="p-1 text-slate-400 text-center">No beams defined.</div>'; }
    }
    simulateOptimizationBtn.addEventListener('click', () => { /* ... from your run_plan.js ... */
        if (currentPlanningMode !== 'inverse') return; const siteData = allStructuresData[currentSite]; if (!siteData) return;
        tpsBeams = []; const numSegments = siteData.name === "Whole Brain" ? 12 : 7;
        const baseFSX = siteData.defaultBeamParams.fsx; const baseFSY = siteData.defaultBeamParams.fsy;
        for (let i = 0; i < numSegments; i++) {
            tpsBeams.push({ angle: Math.round((360 / numSegments) * i + Math.random() * 10 - 5) % 360, sizeX: Math.round(baseFSX * 0.8 + Math.random() * (baseFSX * 0.4)), sizeY: Math.round(baseFSY * 0.8 + Math.random() * (baseFSY * 0.4)), weight: Math.round(80 / numSegments + Math.random() * (40 / numSegments)) });
        }
        updateDVH(true); drawSimulatedIsodose2D(); updateTpsBeamListDisplay();
        if (typeof alert !== 'undefined') alert(`${siteData.name === "Whole Brain" ? "Arc" : "IMRT"} optimization simulated!`);
    });
    function initializeDVHChart() { /* ... from your run_plan.js ... */
        if (dvhChartInstance) dvhChartInstance.destroy();
        dvhChartInstance = new Chart(dvhChartCanvasEl.getContext('2d'), {
             type: 'line', data: { labels: Array.from({ length: 101 }, (_, i) => i.toString()), datasets: [] },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'Dose (Gy)', font: {size: 9}}, ticks: {font: {size: 8}}}, y: { title: { display: true, text: 'Volume (%)', font: {size: 9}}, min: 0, max: 100, ticks: {font: {size: 8}}} }, plugins: { legend: { display: true, position: 'top', labels: {font: {size: 8}, boxWidth:8, padding:3 } } }, animation: { duration: 150 } }
        });
    }
    function updateDVH(isInverseSim = false) { /* ... from your run_plan.js ... */
        if (!dvhChartInstance || !currentSiteStructures) return; const datasets = []; const doseValues = Array.from({ length: 101 }, (_, i) => i); const siteData = allStructuresData[currentSite];
        Object.values(currentSiteStructures).filter(s => s.type === "PTV" && s.visible).forEach(ptv => {
            let ptvTargetScore = 0;
            if (currentPlanningMode === 'forward' && tpsBeams.length > 0) { let totalWeightEffect = tpsBeams.reduce((sum, b) => sum + b.weight,0); ptvTargetScore = Math.min(95, 10 + totalWeightEffect / tpsBeams.length * 0.8); }
            else if (currentPlanningMode === 'inverse') { const ptvObj = siteData.objectives.find(obj => obj.type === "PTV"); ptvTargetScore = ptvObj ? parseFloat(document.getElementById(ptvObj.id)?.value || ptvObj.defaultValue) : 60; if (isInverseSim) ptvTargetScore *= 1.02; }
            ptvTargetScore = Math.max(10, ptvTargetScore);
            datasets.push({ label: ptv.name, data: doseValues.map(dose => conceptualDVHCalculator(100, dose, ptvTargetScore, 0, true)), borderColor: ptv.borderColor, backgroundColor: ptv.color, fill: true, tension: 0.1, pointRadius: 0, borderWidth: 1.5 });
        });
        Object.values(currentSiteStructures).filter(s => s.type === "OAR" && s.visible).forEach(oar => {
            let oarSensitivity = 30; let oarMaxConstraint = 100; const oarObj = siteData.objectives.find(obj => obj.id.toLowerCase().includes(oar.id.split('_')[1]?.toLowerCase()));
            if (currentPlanningMode === 'forward' && tpsBeams.length > 0) { oarSensitivity = tpsBeams.reduce((sum,b) => sum + b.weight, 0) / (tpsBeams.length * 2); }
            else if (currentPlanningMode === 'inverse') { oarSensitivity = oarObj ? (100 - (parseFloat(document.getElementById(oarObj.id)?.value || oarObj.defaultValue) * 0.8)) : 70; if (isInverseSim) oarSensitivity *= 1.1; if (oarObj && oarObj.constraint === "max") oarMaxConstraint = parseFloat(document.getElementById(oarObj.id)?.value || oarObj.defaultValue); }
            oarSensitivity = Math.max(5, Math.min(95, oarSensitivity));
            datasets.push({ label: oar.name, data: doseValues.map(dose => conceptualDVHCalculator(100, dose, 0, oarSensitivity, false, oarMaxConstraint)), borderColor: oar.borderColor, backgroundColor: 'transparent', fill: false, tension: 0.1, borderDash: [3, 3], pointRadius: 0, borderWidth: 1.5 });
        });
        dvhChartInstance.data.datasets = datasets; dvhChartInstance.update(); updatePlanSummary();
    }
    function conceptualDVHCalculator(baseVolume, dose, targetScore, oarSensitivity, isPTV, oarMaxConstraint = 100) { /* ... from your run_plan.js ... */
        let volume = baseVolume;
        if (isPTV) { const targetDose = targetScore; if (dose < targetDose * 0.95) volume = 100; else if (dose < targetDose * 1.05) volume = Math.max(5, 100 - (dose - targetDose * 0.95) * (95 / (targetDose * 0.10 + 1))); else volume = Math.max(0, 5 - (dose - targetDose * 1.05) * 0.8); }
        else { const effectiveTolerance = Math.min(oarMaxConstraint, 100 - oarSensitivity); if (dose < effectiveTolerance * 0.3) volume = Math.max(0, 70 - oarSensitivity * 0.3); else if (dose < effectiveTolerance) volume = Math.max(0, (70 - oarSensitivity * 0.3) - (dose - effectiveTolerance * 0.3) * ((70 - oarSensitivity * 0.3) / (effectiveTolerance * 0.7 + 1))); else volume = 0; }
        return Math.max(0, Math.min(100, volume));
    }
    function drawSimulatedIsodose2D() { /* ... from your run_plan.js ... */
        isodoseOverlaySVG2D.innerHTML = ''; if (tpsBeams.length === 0 && currentPlanningMode === 'forward') return; const ptvData = Object.values(currentSiteStructures).find(s => s.type === "PTV" && s.visible); if (!ptvData) return;
        const ptvRect = { x: ptvData.x, y: ptvData.y, w: ptvData.w, h: ptvData.h }; const ptvCenterX = ptvRect.x + ptvRect.w / 2; const ptvCenterY = ptvRect.y + ptvRect.h / 2; let intensity = 1.0, spread = 1.0;
        if (currentPlanningMode === 'forward' && tpsBeams.length > 0) { intensity = tpsBeams.reduce((sum,b) => sum + b.weight, 0) / (tpsBeams.length * 50 + 1); }
        else if (currentPlanningMode === 'inverse') { const ptvObj = allStructuresData[currentSite].objectives.find(obj => obj.type === "PTV"); intensity = ptvObj ? (parseFloat(document.getElementById(ptvObj.id)?.value || ptvObj.defaultValue) / 60) : 1.0; spread = 0.85; }
        const isoColors = { high: '#16a34a', medium: '#facc15', low: '#60a5fa' };
        const createIsoEllipse = (cx, cy, rx, ry, fill, op) => { const el = document.createElementNS("http://www.w3.org/2000/svg", "ellipse"); el.setAttribute("cx", `${cx}%`); el.setAttribute("cy", `${cy}%`); el.setAttribute("rx", `${rx}%`); el.setAttribute("ry", `${ry}%`); el.style.fill = fill; el.style.opacity = op; isodoseOverlaySVG2D.appendChild(el); };
        createIsoEllipse(ptvCenterX, ptvCenterY, ptvRect.w * 0.5 * intensity * spread, ptvRect.h * 0.6 * intensity * spread, isoColors.high, 0.5);
        createIsoEllipse(ptvCenterX, ptvCenterY, ptvRect.w * 0.8 * intensity * spread, ptvRect.h * 0.9 * intensity * spread, isoColors.medium, 0.35);
        createIsoEllipse(ptvCenterX, ptvCenterY, ptvRect.w * 1.2 * intensity * spread, ptvRect.h * 1.3 * intensity * spread, isoColors.low, 0.2);
    }
    function updatePlanSummary() { /* ... from your run_plan.js ... */
        planSummaryContainer.innerHTML = ''; const siteData = allStructuresData[currentSite]; if (!siteData || !dvhChartInstance.data.datasets.length) { planSummaryContainer.innerHTML = '<p class="text-gray-500">N/A</p>'; return; }
        siteData.planSummaryMetrics.forEach(metricInfo => {
            let metricValueText = "N/A"; const datasetForMetric = dvhChartInstance.data.datasets.find(ds => ds.label === metricInfo.key || (metricInfo.key === "OAR_Lung_Total" && ds.label.includes("Lung")) || (metricInfo.key === "OAR_Lens_L" && ds.label.includes("Lens Left")) || (metricInfo.key === "OAR_Eye_L" && ds.label.includes("Eye Left")));
            if (datasetForMetric) { const doseValues = dvhChartInstance.data.labels.map(l => parseFloat(l)); if (metricInfo.metricType === "DoseAtVolume") { for (let i = 0; i < doseValues.length; i++) { if (datasetForMetric.data[i] <= metricInfo.value) { metricValueText = doseValues[i].toFixed(1) + " " + metricInfo.unit; break; } } if (metricValueText === "N/A") metricValueText = `>${doseValues[doseValues.length-1].toFixed(1)} ${metricInfo.unit}`; } else if (metricInfo.metricType === "VolumeAtDose") { const index = doseValues.findIndex(d => d >= metricInfo.value); if (index !== -1) metricValueText = datasetForMetric.data[index].toFixed(1) + " " + metricInfo.unit; } else if (metricInfo.metricType === "MaxDose") { for (let i = doseValues.length - 1; i >= 0; i--) { if (datasetForMetric.data[i] > 0.5) { metricValueText = doseValues[i].toFixed(1) + " " + metricInfo.unit; break; } } if (metricValueText === "N/A") metricValueText = `<1 ${metricInfo.unit}`; } else if (metricInfo.metricType === "MeanDose") { metricValueText = "Conceptual"; } }
            const p = document.createElement('p'); const objectiveInputEl = siteData.objectives.find(obj => obj.id === metricInfo.id_objective || obj.id.toLowerCase().includes(metricInfo.key.split('_')[1]?.toLowerCase()) || (obj.type==="PTV" && metricInfo.type==="PTV")); let targetValue = metricInfo.target; if(objectiveInputEl && document.getElementById(objectiveInputEl.id)){ targetValue = parseFloat(document.getElementById(objectiveInputEl.id).value); }
            let isMet = false; const numericMetricValue = parseFloat(metricValueText); if (!isNaN(numericMetricValue) && !isNaN(targetValue)) { if (metricInfo.metricType === "DoseAtVolume") isMet = numericMetricValue >= targetValue; else isMet = numericMetricValue <= targetValue; }
            const colorClass = isMet ? 'text-green-600' : 'text-red-600'; const summarySpanId = `summary_${metricInfo.key.replace(/\s+/g, '_')}`;
            p.innerHTML = `${metricInfo.label}: <span id="${summarySpanId}" class="font-semibold ${colorClass}">${metricValueText}</span> (Target: ${metricInfo.constraint || (metricInfo.metricType === "DoseAtVolume" ? ">=" : "<=")}${targetValue}${metricInfo.unit})`;
            planSummaryContainer.appendChild(p);
        }
    function update3DPatientAndTarget() {
    if (targetVolumeMesh3D) {
        // Make the 3D target volume visible
        targetVolumeMesh3D.visible = true;

        // Placeholder for future enhancements:
        // You could add logic here to change the target's size, shape,
        // or position based on the currentSite data if needed.
        // For example:
        // const siteData = allStructuresData[currentSite];
        // if (siteData && siteData.target3DParams) {
        //     targetVolumeMesh3D.scale.set(siteData.target3DParams.scaleX, siteData.target3DParams.scaleY, siteData.target3DParams.scaleZ);
        // }
        console.log("3D Patient and Target Updated (Target Visibility: true)");
    } else {
        console.warn("update3DPatientAndTarget called but targetVolumeMesh3D is not defined.");
    }
}
);
    }

    // --- Initialization ---
    function initializeApp() {
        defineSiteData();
        initThreeJS();
        initializeDVHChart();
        initializeSite(currentSite);

        siteSelect.addEventListener('change', (e) => {
            initializeSite(e.target.value);
        });
        approvePlanBtn.addEventListener('click', () => {
             if (typeof alert !== 'undefined') alert("Plan Approved! (Conceptual Action)");
        });

        window.tpsContext = {
            get beams() { return tpsBeams; },
            get currentPlanningMode() { return currentPlanningMode; },
            get currentSiteStructures() { return JSON.parse(JSON.stringify(currentSiteStructures)); },
            allStructuresData,
            gantryAngleInput, fieldSizeXInput, fieldSizeYInput, beamWeightInput, addBeamBtn,
            applyBeamSettingsBtn, beamListDiv, clearBeamsBtn,
            dvhChartCanvas: dvhChartCanvasEl,
            isodoseOverlaySVG: isodoseOverlaySVG2D,
            planTypeText, simulateOptimizationBtn,
            tabForwardPlanning, tabInversePlanning,
            ptvD95Input: document.getElementById('ptvD95'),
            rectumV70Input: document.getElementById('rectumV70'),
            bladderV75Input: document.getElementById('bladderV75'),
            ptvD95_lungInput: document.getElementById('ptvD95_lung'),
            cordMax_lungInput: document.getElementById('cordMax_lung'),
            lungV20_lungInput: document.getElementById('lungV20_lung'),
            heartMean_lungInput: document.getElementById('heartMean_lung'),
            ptvD95_wbInput: document.getElementById('ptvD95_wb'),
            lensMax_wbInput: document.getElementById('lensMax_wb'),
            eyeMax_wbInput: document.getElementById('eyeMax_wb'),
            brainstemMax_wbInput: document.getElementById('brainstemMax_wb'),
            chiasmMax_wbInput: document.getElementById('chiasmMax_wb'),
            PTV_Prostate_overlay: document.getElementById('PTV_Prostate_overlay2D'),
            OAR_Rectum_overlay: document.getElementById('OAR_Rectum_overlay2D'),
            PTV_Lung_overlay: document.getElementById('PTV_Lung_overlay2D'),
            LANDMARK_Carina_overlay: document.getElementById('LANDMARK_Carina_overlay2D'),
            PTV_WholeBrain_overlay: document.getElementById('PTV_WholeBrain_overlay2D'),
            OAR_Eye_L_overlay: document.getElementById('OAR_Eye_L_overlay2D'),
            OAR_Lens_L_overlay: document.getElementById('OAR_Lens_L_overlay2D'),
            OAR_Brainstem_overlay: document.getElementById('OAR_Brainstem_overlay2D'),
            summary_PTV_D95: document.getElementById('summary_PTV_Prostate'),
            summary_Cord_Max: document.getElementById('summary_OAR_SpinalCord'),
            summary_Lung_V20: document.getElementById('summary_OAR_Lung_Total'),
            summary_PTV_D95_wb: document.getElementById('summary_PTV_WholeBrain'),
            summary_Lens_Max_wb: document.getElementById('summary_OAR_Lens_L'),
            clearBeams: () => clearBeams(),
            switchPlanningMode: (mode) => switchPlanningModeUI(mode),
            setStructureVisibility: (structureKeyArray, isVisible) => {
                if (!currentSiteStructures) return;
                structureKeyArray.forEach(keyName => {
                    const structure = Object.values(currentSiteStructures).find(s => s.id === keyName || s.name.includes(keyName.split('_')[1]));
                    if (structure) { structure.visible = isVisible; }
                    else if (currentSiteStructures[keyName]) { currentSiteStructures[keyName].visible = isVisible; }
                });
                update2DStructureVisuals(); updateDVH();
            },
            ensureStructureVisible: (structureId) => {
                if (currentSiteStructures[structureId] && !currentSiteStructures[structureId].visible) {
                    currentSiteStructures[structureId].visible = true;
                    update2DStructureVisuals(); updateDVH();
                }
            },
        };
        console.log("Integrated TPS Initialized. tpsContext ready for tutorial.");
    }
    initializeApp();
});
