import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

/*
 * RT SCHOOL & LABS - MAIN 3D ENGINE
 * Supports: 3 Floors, Interactive Rooms, Embedded Activities
 */

// =====================================================
// 1. SCENE SETUP
// =====================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d12);
scene.fog = new THREE.FogExp2(0x0b0d12, 0.008);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(40, 60, 60);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// Controls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.1;

// =====================================================
// 2. WORLD BUILDER
// =====================================================
const floors = {};
const rooms = [];
const colliders = [];
const hotspots = [];
let selectedRoom = null;

// Floor Configurations
const floorConfig = [
  { level: 1, y: 0, color: 0x1a1d26, label: "FLOOR 1: CLINIC" },
  { level: 2, y: 20, color: 0x1a1d26, label: "FLOOR 2: DOSIMETRY & NURSING" },
  { level: 3, y: 40, color: 0x1a1d26, label: "FLOOR 3: ADMIN & RESEARCH" }
];

// Helper: Create Wall
function createWall(w, h, d, x, y, z, color=0x2f3542) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Helper: Create Room
function createRoom(floorLevel, data) {
  const floorY = floorConfig.find(f => f.level === floorLevel).y;
  const roomGroup = new THREE.Group();
  
  // Floor Plate
  const geo = new THREE.BoxGeometry(18, 0.5, 18);
  const mat = new THREE.MeshLambertMaterial({ 
    color: data.color, 
    transparent: true, 
    opacity: 0.9 
  });
  const floorMesh = new THREE.Mesh(geo, mat);
  floorMesh.position.set(data.x, floorY + 0.25, data.z);
  floorMesh.userData = { isRoom: true, room: data };
  
  // Walls (Open Front)
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 1), wallMat);
  back.position.set(0, 4, -9);
  
  const left = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 18), wallMat);
  left.position.set(-9, 4, 0);

  const right = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 18), wallMat);
  right.position.set(9, 4, 0);

  floorMesh.add(back, left, right);
  roomGroup.add(floorMesh);
  
  // Store Data
  data.mesh = floorMesh;
  data.floor = floorLevel;
  rooms.push(data);
  floors[floorLevel].group.add(roomGroup);

  // Add Label
  const loader = new FontLoader();
  loader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json', function (font) {
    const textGeo = new TextGeometry(data.name, {
      font: font, size: 1.2, height: 0.1
    });
    const textMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeo, textMat);
    textMesh.rotation.x = -Math.PI / 2;
    textMesh.position.set(data.x - 7, floorY + 0.5, data.z + 5);
    floors[floorLevel].group.add(textMesh);
  });
}

// Helper: Decor Props
const decor = {
  desk: (x, y, z, rot) => {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 3), new THREE.MeshLambertMaterial({color:0x8d6e63}));
    top.position.y = 1.5;
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 3), new THREE.MeshLambertMaterial({color:0x333333}));
    leg1.position.set(-2.8, 0, 0);
    const leg2 = leg1.clone(); leg2.position.set(2.8, 0, 0);
    g.add(top, leg1, leg2);
    g.position.set(x, y + 1.5, z);
    g.rotation.y = rot;
    return g;
  },
  server: (x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 2), new THREE.MeshLambertMaterial({color:0x111111}));
    m.position.set(x, y + 3, z);
    // Add blinking lights
    const light = new THREE.PointLight(0x00ff00, 1, 5);
    light.position.set(0, 2, 1.1);
    m.add(light);
    return m;
  }
};

// =====================================================
// 3. BUILD FLOORS & ROOMS
// =====================================================

// Initialize Floor Groups
floorConfig.forEach(f => {
  const group = new THREE.Group();
  group.position.y = f.y;
  
  // Base Platform
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(100, 1, 80),
    new THREE.MeshLambertMaterial({ color: 0x1a1d26 })
  );
  group.add(platform);
  
  floors[f.level] = { group: group, y: f.y };
  scene.add(group);
});

// --- FLOOR 1: CLINIC ---
createRoom(1, { 
    id: 'f1_lobby', name: 'Lobby & Intake', 
    x: -30, z: 20, color: 0x1f3a5b, 
    description: 'Patient check-in, insurance verification, and ID safety checks.',
    activity: 'lobby' 
});

createRoom(1, { 
    id: 'f1_linac', name: 'Linac Vault 1', 
    x: 0, z: -10, color: 0x2d3436, 
    description: 'Varian TrueBeam Linear Accelerator for external beam radiation.'
});

// --- FLOOR 2: LABS ---
createRoom(2, { 
    id: 'f2_nurse', name: 'Nursing Station', 
    x: -20, z: 10, color: 0xf472b6, 
    description: 'Vitals assessment, blood labs review, and patient performance scoring.',
    activity: 'nursing' 
});

createRoom(2, { 
    id: 'f2_physics', name: 'Physics & Dosimetry', 
    x: 20, z: -10, color: 0x3b82f6, 
    description: 'Treatment planning, image fusion, and emergency alignment simulation.',
    activity: 'physics' 
});

// --- FLOOR 3: ADMIN ---
createRoom(3, { 
    id: 'f3_conf', name: 'Tumor Board', 
    x: 0, z: 0, color: 0x57606f, 
    description: 'Multidisciplinary team meetings for case review.' 
});

// Add Props
floors[1].group.add(decor.desk(-30, 0, 20, 0)); // Lobby Desk
floors[2].group.add(decor.desk(-20, 0, 10, Math.PI)); // Nurse Desk
floors[2].group.add(decor.server(22, 0, -14)); // Physics Server
floors[2].group.add(decor.desk(20, 0, -10, -Math.PI/2)); // Physics Desk

// =====================================================
// 4. INTERACTION LOGIC
// =====================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// UI Elements
const ui = {
    title: document.getElementById('info-title'),
    desc: document.getElementById('info-desc'),
    btnActivity: document.getElementById('btnActivity'),
    btnEnter: document.getElementById('btnEnter'),
    lbl: document.getElementById('sel-lbl')
};

function onMouseClick(event) {
    // Only handle click if not on HUD/Panel
    if (event.target.closest('#hud') || event.target.closest('#info') || event.target.closest('.panel')) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj.userData.isRoom) {
            selectRoom(obj.userData.room);
            return;
        }
    }
    // If clicked empty space
    selectRoom(null);
}

function selectRoom(room) {
    // Reset previous selection visuals
    if (selectedRoom && selectedRoom.mesh) {
        selectedRoom.mesh.material.emissive.setHex(0x000000);
    }

    if (!room) {
        selectedRoom = null;
        ui.title.textContent = "Welcome";
        ui.desc.textContent = "Select a room to view details.";
        ui.lbl.textContent = "--";
        ui.btnActivity.disabled = true;
        ui.btnActivity.textContent = "Start Activity";
        return;
    }

    // Highlight new room
    selectedRoom = room;
    room.mesh.material.emissive.setHex(0x333333);

    // Update UI
    ui.title.textContent = room.name;
    ui.desc.textContent = room.description;
    ui.lbl.textContent = `FL ${room.floor}`;

    // Activate Button if Activity Exists
    if (room.activity) {
        ui.btnActivity.disabled = false;
        ui.btnActivity.textContent = "Start Simulation";
        ui.btnActivity.onclick = () => {
            window.Panels.open(room.activity);
            
            // Trigger Specific Init Logic
            if(room.activity === 'lobby' && window.intake) window.intake.init();
            if(room.activity === 'nursing' && window.nursing) window.nursing.tab('vitals');
            if(room.activity === 'physics' && window.physics) window.physics.init();
        };
    } else {
        ui.btnActivity.disabled = true;
        ui.btnActivity.textContent = "No Activity";
    }
}

window.addEventListener('mousedown', onMouseClick);

// Floor Visibility Controls
document.getElementById('btn-floor-1').onclick = () => setView(1);
document.getElementById('btn-floor-2').onclick = () => setView(2);
document.getElementById('btn-floor-3').onclick = () => setView(3);
document.getElementById('btn-view-all').onclick = () => setView('ALL');

function setView(mode) {
    // Reset Buttons
    document.querySelectorAll('#controls-ui button').forEach(b => b.classList.remove('active'));
    if(mode === 'ALL') document.getElementById('btn-view-all').classList.add('active');
    else document.getElementById(`btn-floor-${mode}`).classList.add('active');

    // Toggle Visibility
    Object.keys(floors).forEach(key => {
        const k = parseInt(key);
        if (mode === 'ALL' || k === mode) {
            floors[k].group.visible = true;
        } else {
            floors[k].group.visible = false;
        }
    });

    // Update Cam Target
    if (mode === 2) {
        orbitControls.target.set(0, 20, 0);
        camera.position.set(40, 50, 60);
    } else if (mode === 3) {
        orbitControls.target.set(0, 40, 0);
        camera.position.set(40, 70, 60);
    } else {
        orbitControls.target.set(0, 0, 0);
        camera.position.set(40, 60, 60);
    }
}

// =====================================================
// 5. ANIMATION LOOP
// =====================================================
function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene, camera);
}
animate();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
