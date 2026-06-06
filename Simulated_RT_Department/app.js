import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/* =========================================================================
   SIMULATED RADIATION CENTER
   A self-contained, single-floor radiation oncology suite built from
   procedural geometry. Five rooms: Waiting/Lobby, Exam, CT Simulation,
   Physics/Dosimetry, LINAC Vault. Every machine is driveable.
   ========================================================================= */

let scene, camera, renderer, labelRenderer, orbit, clock;
const canvas = document.getElementById('scene');

/* ---- navigation state ---- */
let mode = 'overview';
const keys = {};
const player = { pos: new THREE.Vector3(0, 1.6, 26), yaw: Math.PI, pitch: 0, locked: false };
let selectedRoom = null;

/* ---- machine state (single source of truth) ---- */
const M = {
  // CT scanner
  ct:   { couchZ: 0, scanning: false, scanDir: 1, gantrySpin: 0, spinning: false, lasers: true },
  // LINAC
  linac:{ gantry: 0, gantryTarget: 0, gantryArc: false, coll: 0,
          couchV: 0, couchL: 0, couchLat: 0, couchRot: 0,
          jawX: 10, jawY: 10, beam: false, mu: 0, muTarget: 0, mlc: 0, epid: false },
  // Physics phantom
  phys: { chamberDepth: 5, scanning: false, reading: 0 },
  // Exam
  exam: { tableUp: false }
};

/* ============================ MATERIALS ================================= */
const MAT = {};
function buildMaterials() {
  const std = (c, r = 0.7, m = 0.05, o = {}) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...o });
  MAT.floorMain   = std(0xdfe4e8, 0.85, 0.02);
  MAT.floorVault  = std(0xb9c0c6, 0.9, 0.02);
  MAT.wall        = std(0xf1f3f5, 0.95, 0.0);
  MAT.wallVault   = std(0xc7cdd2, 0.92, 0.02);
  MAT.trim        = std(0x2b6cff, 0.5, 0.1);
  MAT.glass       = std(0x9fd9ff, 0.1, 0.0, { transparent: true, opacity: 0.18 });
  MAT.metal       = std(0xc4cacf, 0.35, 0.85);
  MAT.metalDark   = std(0x6b7177, 0.4, 0.8);
  MAT.plastic     = std(0xf6f7f8, 0.6, 0.05);
  MAT.plasticDk   = std(0x3a4047, 0.6, 0.1);
  MAT.couch       = std(0x2f3a45, 0.7, 0.1);
  MAT.couchPad    = std(0x20262e, 0.85, 0.0);
  MAT.skin        = std(0xe7b59a, 0.85, 0.0);
  MAT.gown        = std(0x7fd0ce, 0.85, 0.0);
  MAT.accentTeal  = std(0x1b8c87, 0.5, 0.2, { emissive: 0x062b29, emissiveIntensity: 0.4 });
  MAT.accentAmber = std(0xffb454, 0.5, 0.2, { emissive: 0x4a2c00, emissiveIntensity: 0.5 });
  MAT.screen      = std(0x0c1c2c, 0.3, 0.0, { emissive: 0x123a52, emissiveIntensity: 0.9 });
  MAT.rubber      = std(0x23282d, 0.9, 0.0);
  MAT.water       = std(0x2f88c0, 0.15, 0.0, { transparent: true, opacity: 0.4 });
  MAT.beam        = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
  MAT.laser       = new THREE.LineBasicMaterial({ color: 0x35ff7a, transparent: true, opacity: 0.85 });
  MAT.laserR      = new THREE.LineBasicMaterial({ color: 0xff4d4d, transparent: true, opacity: 0.85 });
}

/* small geometry helpers */
function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function cyl(rt, rb, h, mat, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.castShadow = true; m.receiveShadow = true; return m;
}
function label(text, cls = 'lab') {
  const div = document.createElement('div');
  div.textContent = text;
  div.style.cssText = `font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:13px;
    letter-spacing:.5px;color:#0c1014;background:rgba(255,255,255,0.82);padding:3px 9px;border-radius:6px;
    border:1px solid rgba(0,0,0,0.08);box-shadow:0 4px 14px rgba(0,0,0,0.25);white-space:nowrap;`;
  return new CSS2DObject(div);
}

/* ============================ ROOM LAYOUT ==============================
   Plan (top-down). X = lateral, Z = depth (negative = far/back).
   Corridor runs along X at z=0. Rooms front (z+) and back (z-).
   Vault is an oversized shielded room at back-right with a maze entry.
*/
const COL = {
  lobby:'#6fb6ff', exam:'#a98bff', ct:'#3fd6cf', phys:'#ffb454', vault:'#ff7d7d'
};
const ROOMS = [
  { id:'lobby', name:'Waiting / Lobby',     kicker:'Reception', col:COL.lobby,
    x:-17, z:13, w:16, d:18, cam:[-17,11,30], look:[-17,1,13],
    desc:'Patient intake, seating and reception. The calm front-of-house for the center.' },
  { id:'exam',  name:'Exam Room',           kicker:'Consult', col:COL.exam,
    x:-17, z:-12, w:16, d:16, cam:[-17,9,2], look:[-17,1,-12],
    desc:'Physician consult and on-table assessment. Raise/lower the exam table to position the patient.' },
  { id:'ct',    name:'CT Simulation Suite', col:COL.ct, kicker:'Imaging',
    x:6, z:13, w:18, d:18, cam:[6,11,33], look:[6,1,13],
    desc:'CT simulator with movable couch, rotating gantry and alignment lasers used to plan treatment geometry.' },
  { id:'phys',  name:'Physics / Dosimetry', col:COL.phys, kicker:'QA & Planning',
    x:6, z:-12, w:18, d:16, cam:[6,9,4], look:[6,1,-12],
    desc:'Water-phantom dosimetry bench, ion chamber and electrometer for machine QA and dose measurement.' },
  { id:'vault', name:'LINAC Vault',         col:COL.vault, kicker:'Treatment',
    x:30, z:1, w:22, d:30, cam:[30,15,40], look:[30,2,1],
    desc:'Shielded vault housing the linear accelerator: rotating gantry, collimator/MLC, robotic couch and treatment beam.' },
];
const roomById = id => ROOMS.find(r => r.id === id);

/* collider list for walk mode */
const colliders = [];
function addCollider(x, z, w, d) { colliders.push({ x, z, hw: w / 2, hd: d / 2 }); }

/* machine pivots (filled by builders) */
const RIG = {};

/* ============================ BUILDING ================================== */
function buildBuilding() {
  // ground slab beneath everything
  const slab = box(120, 0.2, 120, MAT.floorMain, 6, -0.11, 0);
  slab.receiveShadow = true; scene.add(slab);

  // soft exterior ground
  const ext = new THREE.Mesh(new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: 0x171c22, roughness: 1 }));
  ext.rotation.x = -Math.PI / 2; ext.position.y = -0.25; ext.receiveShadow = true; scene.add(ext);

  // each room: floor tint + walls with a doorway gap toward the corridor
  ROOMS.forEach(r => {
    const isVault = r.id === 'vault';
    const fmat = isVault ? MAT.floorVault : MAT.floorMain;
    const f = box(r.w - 0.2, 0.06, r.d - 0.2, fmat, r.x, 0.02, r.z);
    f.userData.roomId = r.id; f.receiveShadow = true; scene.add(f);

    // colored inlay strip to read the room identity from above
    const inlay = box(r.w - 1.4, 0.08, 0.5, new THREE.MeshStandardMaterial({ color: r.col, roughness: .6 }),
      r.x, 0.05, r.z - r.d / 2 + 0.9);
    scene.add(inlay);

    buildRoomWalls(r, isVault);

    // floating label
    const lab = label(r.name);
    lab.position.set(r.x, isVault ? 6.2 : 4.4, r.z);
    lab.userData.roomLabel = r.id;
    scene.add(lab);
  });

  // exterior shell perimeter (visual only)
  buildShell();
  addLighting();
}

function wallSeg(x, z, w, d, h, mat, collide = true) {
  const m = box(w, h, d, mat, x, h / 2, z);
  scene.add(m);
  if (collide) addCollider(x, z, w, d);
  return m;
}

/* Build four walls for a room with a doorway gap on the corridor-facing side.
   Corridor is at z=0 between front (z>0) and back (z<0) rooms; vault opens left. */
function buildRoomWalls(r, isVault) {
  const h = isVault ? 6.2 : 3.6;
  const t = isVault ? 0.7 : 0.18;          // wall thickness (vault = thick shielding)
  const mat = isVault ? MAT.wallVault : MAT.wall;
  const hx = r.w / 2, hz = r.d / 2;
  const door = 2.6;                         // doorway width

  // Determine which edge faces the corridor and gets the door.
  // lobby/ct front rooms (z>0): door on their inner (z-) edge
  // exam/phys back rooms (z<0): door on their inner (z+) edge
  // vault: door on its inner (x-) edge facing corridor
  let doorEdge;
  if (isVault) doorEdge = 'xmin';
  else doorEdge = r.z > 0 ? 'zmin' : 'zmax';

  // helper to build a wall along an edge, optionally with a centered gap
  function edge(side) {
    const gap = (side === doorEdge);
    if (side === 'zmin' || side === 'zmax') {
      const zz = r.z + (side === 'zmin' ? -hz : hz);
      if (!gap) { wallSeg(r.x, zz, r.w, t, h, mat); }
      else {
        const segW = (r.w - door) / 2;
        wallSeg(r.x - (door / 2 + segW / 2), zz, segW, t, h, mat);
        wallSeg(r.x + (door / 2 + segW / 2), zz, segW, t, h, mat);
        // lintel above the door
        const lin = box(door, h - 2.2, t, mat, r.x, 2.2 + (h - 2.2) / 2, zz);
        scene.add(lin);
      }
    } else {
      const xx = r.x + (side === 'xmin' ? -hx : hx);
      if (!gap) { wallSeg(xx, r.z, t, r.d, h, mat); }
      else {
        const segD = (r.d - (isVault ? 4 : door)) / 2;
        const dw = isVault ? 4 : door;       // vault has a wider maze opening
        wallSeg(xx, r.z - (dw / 2 + segD / 2), t, segD, h, mat);
        wallSeg(xx, r.z + (dw / 2 + segD / 2), t, segD, h, mat);
      }
    }
  }
  ['zmin', 'zmax', 'xmin', 'xmax'].forEach(edge);

  // vault: a short maze baffle inside the doorway (radiation maze)
  if (isVault) {
    wallSeg(r.x - hx + 4, r.z - 3, 0.6, 9, h, mat);
  }

  // window into the corridor for lobby & ct (glass strip, non-colliding visual)
  if (!isVault && r.z > 0) {
    const zz = r.z - hz;
    const g = box(r.w - door - 1.2, 1.6, 0.05, MAT.glass, r.x, 1.9, zz + 0.02);
    scene.add(g);
  }
  // control-room window from corridor into vault
  if (isVault) {
    const g = box(0.06, 1.4, 3.2, MAT.glass, r.x - hx - 0.02, 2.0, r.z + 8);
    scene.add(g);
  }

  // baseboard accent inside each room
  const bb = new THREE.Mesh(
    new THREE.BoxGeometry(r.w - 0.4, 0.18, r.d - 0.4),
    new THREE.MeshStandardMaterial({ color: r.col, roughness: .8, transparent: true, opacity: .0 }));
  bb.position.set(r.x, 0.09, r.z); scene.add(bb);
}

function buildShell() {
  // thin exterior perimeter walls wrapping the whole footprint
  const minX = -27, maxX = 43, minZ = -22, maxZ = 24, h = 3.6, t = 0.3;
  const mat = new THREE.MeshStandardMaterial({ color: 0xe7ebee, roughness: .95 });
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2, W = maxX - minX, D = maxZ - minZ;
  // back, and sides only (front kept open-ish for camera); all non-colliding visual frame
  [['n', cx, minZ, W, t], ['s', cx, maxZ, W, t], ['w', minX, cz, t, D], ['e', maxX, cz, t, D]]
    .forEach(([_, x, z, w, d]) => {
      const m = box(w, h, d, mat, x, h / 2, z); m.castShadow = false; scene.add(m);
    });
}

function addLighting() {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6a7178, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(20, 38, 24);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -60; key.shadow.camera.right = 60;
  key.shadow.camera.top = 60; key.shadow.camera.bottom = -60;
  key.shadow.camera.far = 140; key.shadow.bias = -0.0004;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xbfe6ff, 0.35);
  fill.position.set(-25, 20, -20); scene.add(fill);

  // warm ceiling pools per room
  ROOMS.forEach(r => {
    const p = new THREE.PointLight(0xfff2e0, r.id === 'vault' ? 0.7 : 0.5, 26, 2);
    p.position.set(r.x, r.id === 'vault' ? 5 : 3.2, r.z); scene.add(p);
  });
}

/* ============================ PATIENT ================================== */
// supine patient lying along +Z (head toward +Z). Returned group sits at couch top.
function buildPatient() {
  const g = new THREE.Group();
  const torso = cyl(0.42, 0.5, 1.5, MAT.gown); torso.rotation.x = Math.PI / 2; torso.position.set(0, 0.18, 0.1); g.add(torso);
  const hips = box(0.78, 0.34, 0.7, MAT.gown, 0, 0.16, -0.85); g.add(hips);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 16), MAT.skin); head.position.set(0, 0.2, 1.18); head.castShadow = true; g.add(head);
  const neck = cyl(0.13, 0.15, 0.2, MAT.skin); neck.position.set(0, 0.16, 0.96); g.add(neck);
  // legs
  [-0.2, 0.2].forEach(sx => {
    const thigh = cyl(0.17, 0.2, 1.0, MAT.gown); thigh.rotation.x = Math.PI / 2; thigh.position.set(sx, 0.12, -1.6); g.add(thigh);
    const shin = cyl(0.12, 0.16, 1.0, MAT.skin); shin.rotation.x = Math.PI / 2; shin.position.set(sx, 0.08, -2.55); g.add(shin);
    const foot = box(0.2, 0.18, 0.34, MAT.skin, sx, 0.08, -3.15); g.add(foot);
  });
  // arms along sides
  [-0.55, 0.55].forEach(sx => {
    const arm = cyl(0.1, 0.12, 1.4, MAT.skin); arm.rotation.x = Math.PI / 2; arm.position.set(sx, 0.1, -0.2); g.add(arm);
  });
  g.scale.set(0.95, 0.95, 0.95);
  return g;
}

/* ============================ LOBBY =================================== */
function buildLobby() {
  const r = roomById('lobby');
  // reception desk
  const desk = new THREE.Group();
  const base = box(4.6, 1.1, 1.2, MAT.plasticDk, 0, 0.55, 0); desk.add(base);
  const top = box(5.0, 0.1, 1.5, MAT.metal, 0, 1.12, 0); desk.add(top);
  const front = box(4.6, 0.5, 0.1, new THREE.MeshStandardMaterial({ color: r.col, roughness: .6 }), 0, 0.8, 0.62); desk.add(front);
  desk.position.set(r.x + 3.5, 0, r.z + 5.5); desk.rotation.y = -Math.PI / 4; scene.add(desk);
  addCollider(r.x + 3.5, r.z + 5.5, 5, 1.5);

  // seating rows (waiting chairs)
  function chair(x, z, ry) {
    const c = new THREE.Group();
    c.add(box(0.6, 0.1, 0.6, MAT.plastic, 0, 0.45, 0));
    c.add(box(0.6, 0.6, 0.1, MAT.plastic, 0, 0.75, -0.27));
    c.add(box(0.6, 0.45, 0.05, new THREE.MeshStandardMaterial({ color: r.col, roughness: .8 }), 0, 0.68, -0.24));
    [[-.25, -.25], [.25, -.25], [-.25, .25], [.25, .25]].forEach(([dx, dz]) =>
      c.add(box(0.06, 0.45, 0.06, MAT.metalDark, dx, 0.22, dz)));
    c.position.set(x, 0, z); c.rotation.y = ry; scene.add(c);
  }
  for (let i = 0; i < 4; i++) { chair(r.x - 5 + i * 1.4, r.z - 2, 0); chair(r.x - 5 + i * 1.4, r.z + 1, Math.PI); }
  // plant
  const pot = cyl(0.4, 0.3, 0.6, MAT.plasticDk); pot.position.set(r.x - 6, 0.3, r.z + 6); scene.add(pot);
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), new THREE.MeshStandardMaterial({ color: 0x3f8c5a, roughness: .9 }));
  leaves.position.set(r.x - 6, 1.1, r.z + 6); leaves.castShadow = true; scene.add(leaves);
}

/* ============================ EXAM ROOM ============================== */
function buildExam() {
  const r = roomById('exam');
  // exam table with a hydraulic-ish base (raises/lowers)
  const tbl = new THREE.Group();
  const pedestal = box(0.7, 0.9, 1.6, MAT.metalDark, 0, 0.45, 0); tbl.add(pedestal);
  const lift = new THREE.Group();
  const top = box(0.9, 0.16, 2.4, MAT.couch, 0, 0, 0); lift.add(top);
  const pad = box(0.84, 0.12, 2.3, new THREE.MeshStandardMaterial({ color: 0x2563a8, roughness: .8 }), 0, 0.13, 0); lift.add(pad);
  const headrest = box(0.84, 0.12, 0.5, new THREE.MeshStandardMaterial({ color: 0x2563a8, roughness: .8 }), 0, 0.2, 1.0); lift.add(headrest);
  lift.position.y = 0.95;
  tbl.add(lift);
  tbl.position.set(r.x, 0, r.z); scene.add(tbl);
  addCollider(r.x, r.z, 1.2, 2.6);
  RIG.examLift = lift;

  // wall monitor
  const mon = box(1.4, 0.85, 0.08, MAT.screen, r.x + 6.6, 2.0, r.z); mon.rotation.y = -Math.PI / 2; scene.add(mon);
  // counter + sink
  const counter = box(3.0, 0.95, 0.7, MAT.plastic, r.x - 5.4, 0.47, r.z - 5); scene.add(counter);
  addCollider(r.x - 5.4, r.z - 5, 3, 0.7);
  const sink = box(0.6, 0.1, 0.4, MAT.metal, r.x - 5.4, 0.96, r.z - 5); scene.add(sink);
  // doctor stool
  const stool = cyl(0.28, 0.28, 0.1, new THREE.MeshStandardMaterial({ color: r.col, roughness: .8 }));
  stool.position.set(r.x + 2.4, 0.6, r.z + 3); scene.add(stool);
  stool.add(cyl(0.05, 0.05, 0.6, MAT.metalDark).translateY(-0.35));
}

/* ============================ CT SIMULATION ========================== */
function buildCT() {
  const r = roomById('ct');
  const cx = r.x, cz = r.z + 1, boreY = 1.25;

  // gantry: big ring (torus) standing vertically, with a housing
  const gantry = new THREE.Group();
  const housing = cyl(1.9, 1.9, 1.3, MAT.plastic, 40); housing.rotation.x = Math.PI / 2; housing.position.set(0, boreY, 0); gantry.add(housing);
  // bore (dark inner tube)
  const bore = cyl(1.05, 1.05, 1.4, MAT.plasticDk, 40); bore.rotation.x = Math.PI / 2; bore.position.set(0, boreY, 0);
  bore.material = new THREE.MeshStandardMaterial({ color: 0x12161b, roughness: .6, side: THREE.BackSide }); gantry.add(bore);
  // teal bore ring accent
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 12, 40), MAT.accentTeal);
  ring.position.set(0, boreY, 0.72); gantry.add(ring);
  // spinning internals (tube + detector marker visible through bore)
  const spin = new THREE.Group();
  const tube = box(0.3, 0.3, 0.3, MAT.accentAmber, 0, 1.45, 0); spin.add(tube);
  const det = box(0.5, 0.16, 0.3, MAT.metalDark, 0, -1.45, 0); spin.add(det);
  spin.position.set(0, boreY, 0); gantry.add(spin);
  RIG.ctSpin = spin;
  gantry.position.set(cx, 0, cz - 2); scene.add(gantry);
  addCollider(cx, cz - 2, 3.8, 1.5);
  RIG.ctGantry = gantry;

  // couch: base + long top that telescopes in Z (toward bore at -Z)
  const base = box(0.8, boreY - 0.05, 1.2, MAT.metalDark, cx, (boreY - 0.05) / 2, cz + 3.2); scene.add(base);
  const couch = new THREE.Group();
  const top = box(0.7, 0.12, 5.2, MAT.couch, 0, 0, 0); couch.add(top);
  const pad = box(0.6, 0.08, 5.0, MAT.couchPad, 0, 0.1, 0); couch.add(pad);
  const patient = buildPatient(); patient.position.set(0, 0.16, 0.6); couch.add(patient);
  couch.position.set(cx, boreY, cz + 2.0);  // top sits at bore height
  scene.add(couch);
  RIG.ctCouch = couch;
  RIG.ctCouchBaseZ = cz + 2.0;

  // alignment lasers (sagittal + axial + coronal lines crossing at iso = bore center)
  const lasers = new THREE.Group();
  const isoZ = cz - 2;
  // sagittal vertical (Y) line at x=cx
  const vline = laserLine([cx, boreY - 1.4, isoZ], [cx, boreY + 1.4, isoZ], MAT.laser); lasers.add(vline);
  // coronal horizontal (X) line
  const hline = laserLine([cx - 1.6, boreY, isoZ], [cx + 1.6, boreY, isoZ], MAT.laserR); lasers.add(hline);
  // axial long line along Z on the patient
  const zline = laserLine([cx, boreY + 0.32, isoZ - 1], [cx, boreY + 0.32, isoZ + 4], MAT.laser); lasers.add(zline);
  scene.add(lasers); RIG.ctLasers = lasers;

  // overhead laser box marker
  const lbox = box(0.5, 0.2, 0.5, MAT.accentTeal, cx, 3.3, isoZ); scene.add(lbox);

  // operator console (in corner, faces room)
  buildConsole(cx + 6.4, r.z - 6, Math.PI, r.col);
}
function laserLine(a, b, mat) {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(
    [new THREE.Vector3(...a), new THREE.Vector3(...b)]), mat);
}
function buildConsole(x, z, ry, col) {
  const g = new THREE.Group();
  g.add(box(2.4, 0.9, 0.9, MAT.plasticDk, 0, 0.45, 0));
  const m1 = box(1.0, 0.6, 0.05, MAT.screen, -0.6, 1.3, -0.2); g.add(m1);
  const m2 = box(1.0, 0.6, 0.05, MAT.screen, 0.6, 1.3, -0.2); g.add(m2);
  g.add(box(1.4, 0.05, 0.5, MAT.plastic, 0, 0.92, 0.2)); // keyboard tray
  g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
}

/* ============================ PHYSICS / DOSIMETRY ==================== */
function buildPhysics() {
  const r = roomById('phys');
  // water phantom tank on a bench
  const bench = box(2.6, 0.9, 2.0, MAT.plasticDk, r.x - 3, 0.45, r.z); scene.add(bench);
  addCollider(r.x - 3, r.z, 2.6, 2.0);
  const tankWall = new THREE.MeshStandardMaterial({ color: 0xbfeefc, roughness: .1, metalness: 0, transparent: true, opacity: .22 });
  const tank = box(1.5, 1.3, 1.5, tankWall, r.x - 3, 1.55, r.z); scene.add(tank);
  const water = box(1.42, 1.05, 1.42, MAT.water, r.x - 3, 1.45, r.z); scene.add(water);
  RIG.physWaterTopY = 1.45 + 1.05 / 2;

  // gantry arm holding the ion chamber that lowers into the water
  const armPost = box(0.12, 1.8, 0.12, MAT.metal, r.x - 3, 2.6, r.z - 0.85); scene.add(armPost);
  const armTop = box(0.12, 0.12, 1.0, MAT.metal, r.x - 3, 3.45, r.z - 0.4); scene.add(armTop);
  const chamberRig = new THREE.Group();
  const stem = cyl(0.03, 0.03, 1.2, MAT.metalDark); stem.position.y = -0.6; chamberRig.add(stem);
  const chamber = cyl(0.07, 0.07, 0.22, MAT.accentAmber); chamber.position.y = -1.25; chamberRig.add(chamber);
  chamberRig.position.set(r.x - 3, 3.45, r.z); scene.add(chamberRig);
  RIG.physChamber = chamberRig;
  RIG.physChamberTopY = 3.45;

  // electrometer / readout console
  buildConsole(r.x + 5, r.z + 4, Math.PI + 0.3, r.col);
  // a planning workstation desk
  const desk = box(2.2, 0.9, 0.8, MAT.plastic, r.x + 4.5, 0.45, r.z - 5); scene.add(desk);
  addCollider(r.x + 4.5, r.z - 5, 2.2, 0.8);
  const mon = box(1.1, 0.65, 0.05, MAT.screen, r.x + 4.5, 1.4, r.z - 5.2); scene.add(mon);
  // shelving with phantoms
  for (let i = 0; i < 3; i++) {
    const ph = box(0.5, 0.5, 0.5, new THREE.MeshStandardMaterial({ color: 0xe8eaec, roughness: .6 }),
      r.x - 6.5, 0.6 + i * 0.7, r.z + 5); scene.add(ph);
  }
}

/* ============================ LINAC ================================== */
function buildLinac() {
  const r = roomById('vault');
  const cx = r.x, cz = r.z, isoY = 1.3;     // isocenter
  const SAD = 2.2;                            // source–axis distance (visual)

  // --- fixed stand / drum housing behind the gantry ---
  const stand = new THREE.Group();
  const drum = cyl(2.2, 2.2, 1.4, MAT.plastic, 48); drum.rotation.z = Math.PI / 2;
  drum.position.set(0, isoY, -2.4); stand.add(drum);
  const drumFace = cyl(2.25, 2.25, 0.2, MAT.metal, 48); drumFace.rotation.z = Math.PI / 2;
  drumFace.position.set(0.7, isoY, -2.4); stand.add(drumFace);
  const stbase = box(3.4, isoY + 0.2, 3.0, MAT.metalDark, 0, (isoY + 0.2) / 2 - 0.3, -3.2); stand.add(stbase);
  stand.position.set(cx, 0, cz); scene.add(stand);
  addCollider(cx, cz - 2.6, 4, 3.2);

  // --- rotating gantry group (rotates about Z axis through isocenter) ---
  const gantry = new THREE.Group();
  gantry.position.set(cx, isoY, cz);
  scene.add(gantry);
  RIG.linacGantry = gantry;

  // gantry arm reaching from drum up & over to the treatment head (above iso)
  const arm = box(0.9, 0.9, 1.5, MAT.plastic, 0, SAD - 0.2, -1.6); gantry.add(arm);
  const armV = box(0.9, SAD + 0.3, 0.9, MAT.plastic, 0, (SAD - 0.4) / 2 + 0.2, -2.2); gantry.add(armV);

  // --- treatment head (carries collimator + MLC), points toward iso ---
  const head = new THREE.Group();
  head.position.set(0, SAD, 0);             // above isocenter at SAD
  gantry.add(head);
  RIG.linacHead = head;                     // collimator rotation spins this about Y(beam) axis
  const headBody = box(1.1, 0.9, 1.1, MAT.plastic, 0, 0.1, 0); head.add(headBody);
  const headRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 12, 32), MAT.accentTeal);
  headRing.rotation.x = Math.PI / 2; headRing.position.y = -0.4; head.add(headRing);
  // jaws (field-defining) - two pairs of blocks below head
  const jaws = new THREE.Group(); jaws.position.y = -0.5; head.add(jaws);
  RIG.linacJaws = jaws;
  const jx1 = box(0.12, 0.3, 0.9, MAT.metalDark, 0, 0, 0); jaws.add(jx1);
  const jx2 = box(0.12, 0.3, 0.9, MAT.metalDark, 0, 0, 0); jaws.add(jx2);
  const jy1 = box(0.9, 0.3, 0.12, MAT.metalDark, 0, 0, 0); jaws.add(jy1);
  const jy2 = box(0.9, 0.3, 0.12, MAT.metalDark, 0, 0, 0); jaws.add(jy2);
  RIG.jx1 = jx1; RIG.jx2 = jx2; RIG.jy1 = jy1; RIG.jy2 = jy2;
  // MLC leaves (two banks) below jaws
  const mlc = new THREE.Group(); mlc.position.y = -0.42; head.add(mlc);
  RIG.mlcLeaves = [];
  for (let i = 0; i < 8; i++) {
    const z = -0.35 + i * 0.1;
    const lA = box(0.5, 0.1, 0.085, MAT.metal, -0.25, 0, z); mlc.add(lA);
    const lB = box(0.5, 0.1, 0.085, MAT.metal, 0.25, 0, z); mlc.add(lB);
    RIG.mlcLeaves.push([lA, lB]);
  }

  // --- beam cone from head through isocenter to floor ---
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.5, SAD + 1.4, 24, 1, true), MAT.beam);
  beam.position.y = SAD / 2 - 0.7;          // apex near source, widening downward
  beam.rotation.x = Math.PI;                // apex up
  beam.visible = false; head.add(beam);
  RIG.linacBeam = beam;

  // --- EPID imaging panel opposite the head (below isocenter) ---
  const epidArm = box(0.5, SAD - 0.3, 0.5, MAT.plastic, 0, -(SAD - 0.3) / 2, 0); gantry.add(epidArm);
  const epid = box(1.3, 0.18, 1.3, MAT.metalDark, 0, -SAD + 0.2, 0); gantry.add(epid);
  RIG.linacEPID = [epidArm, epid];
  epidArm.visible = false; epid.visible = false;

  // --- robotic patient couch (6 DOF subset) ---
  const couchRoot = new THREE.Group(); couchRoot.position.set(cx, 0, cz + 0.0); scene.add(couchRoot);
  // pedestal at iso side
  const ped = box(1.0, 0.9, 1.0, MAT.metalDark, 0, 0.45, 4.0); couchRoot.add(ped);
  // vertical lift
  const lift = new THREE.Group(); lift.position.set(0, isoY, 4.0); couchRoot.add(lift);
  RIG.linacLift = lift;
  // rotation (isocentric couch angle) about Y
  const rot = new THREE.Group(); lift.add(rot); RIG.linacRot = rot;
  // couch top, extends toward isocenter (-Z) and translates lateral(X)/long(Z)
  const topGrp = new THREE.Group(); rot.add(topGrp); RIG.linacTop = topGrp;
  const ctop = box(0.75, 0.12, 5.0, MAT.couch, 0, 0, -1.5); topGrp.add(ctop);
  const cpad = box(0.66, 0.08, 4.8, MAT.couchPad, 0, 0.1, -1.5); topGrp.add(cpad);
  const pat = buildPatient(); pat.position.set(0, 0.16, -2.8); pat.rotation.y = Math.PI; topGrp.add(pat);

  // iso crosshair marker (tiny)
  const isoMark = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xff5d5d })); isoMark.position.set(cx, isoY, cz); scene.add(isoMark);

  // wall lasers in vault (alignment)
  const vl = new THREE.Group();
  vl.add(laserLine([cx - 3, isoY, cz], [cx + 3, isoY, cz], MAT.laserR));
  vl.add(laserLine([cx, isoY - 2, cz], [cx, isoY + 2.4, cz], MAT.laser));
  vl.add(laserLine([cx, isoY, cz - 4], [cx, isoY, cz + 5], MAT.laser));
  scene.add(vl); RIG.linacLasers = vl;

  // warning beacon on wall
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x551111, emissive: 0x000000 }));
  beacon.position.set(cx, 5.4, cz - 12); scene.add(beacon); RIG.linacBeacon = beacon;

  // control console in the corridor "control room" niche just outside vault
  buildConsole(cx - 13.5, cz + 8, Math.PI / 2, r.col);
}

/* ============================ NAVIGATION ============================= */
function setMode(m) {
  mode = m;
  document.querySelectorAll('#modeSeg button').forEach(b =>
    b.classList.toggle('active', b.dataset.mode === m));
  document.getElementById('walkhint').classList.toggle('show', m === 'walk');
  orbit.enabled = (m === 'overview');
  if (m === 'walk') {
    player.pos.set(0, 1.6, 1); player.yaw = -Math.PI / 2; player.pitch = 0;
    canvas.requestPointerLock?.();
  } else {
    document.exitPointerLock?.();
    frameOverview();
  }
}
function frameOverview() {
  gsapTo(camera.position, { x: 8, y: 46, z: 52 }, 0.9);
  orbit.target.set(8, 1, 0);
}
function focusRoom(r) {
  selectedRoom = r;
  document.querySelectorAll('.roomcard').forEach(c =>
    c.classList.toggle('active', c.dataset.id === r.id));
  buildPanel(r);
  if (mode === 'overview') {
    gsapTo(camera.position, { x: r.cam[0], y: r.cam[1], z: r.cam[2] }, 0.8);
    gsapTo(orbit.target, { x: r.look[0], y: r.look[1], z: r.look[2] }, 0.8);
  } else {
    // teleport just outside the room toward corridor
    player.pos.set(r.x, 1.6, r.z > 0 ? r.z - r.d / 2 + 2 : r.z + r.d / 2 - 2);
    player.yaw = r.z > 0 ? 0 : Math.PI;
    if (r.id === 'vault') { player.pos.set(r.x - r.w / 2 + 2, 1.6, r.z); player.yaw = -Math.PI / 2; }
  }
  toast(`Entered <b>${r.name}</b>`);
}

/* tiny tween helper (no external libs) */
const tweens = [];
function gsapTo(obj, to, dur) {
  const from = {}; Object.keys(to).forEach(k => from[k] = obj[k]);
  tweens.push({ obj, from, to, t: 0, dur });
}
function stepTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i]; tw.t += dt / tw.dur;
    const e = tw.t >= 1 ? 1 : 1 - Math.pow(1 - tw.t, 3); // easeOutCubic
    Object.keys(tw.to).forEach(k => tw.obj[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e);
    if (tw.t >= 1) tweens.splice(i, 1);
  }
}

/* walk movement with simple AABB collision */
function updateWalk(dt) {
  const speed = (keys['shift'] ? 7 : 3.6) * dt;
  const fwd = new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw));
  const right = new THREE.Vector3(Math.sin(player.yaw - Math.PI / 2), 0, Math.cos(player.yaw - Math.PI / 2));
  const move = new THREE.Vector3();
  if (keys['w']) move.add(fwd); if (keys['s']) move.sub(fwd);
  if (keys['d']) move.add(right); if (keys['a']) move.sub(right);
  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(speed);
    tryMove(player.pos, move.x, 0);
    tryMove(player.pos, 0, move.z);
  }
  camera.position.copy(player.pos);
  const dir = new THREE.Vector3(
    Math.sin(player.yaw) * Math.cos(player.pitch),
    Math.sin(player.pitch),
    Math.cos(player.yaw) * Math.cos(player.pitch));
  camera.lookAt(player.pos.clone().add(dir));
}
function tryMove(pos, dx, dz) {
  const nx = pos.x + dx, nz = pos.z + dz, rad = 0.4;
  let blocked = false;
  for (const c of colliders) {
    if (nx > c.x - c.hw - rad && nx < c.x + c.hw + rad &&
        nz > c.z - c.hd - rad && nz < c.z + c.hd + rad) { blocked = true; break; }
  }
  if (!blocked) { pos.x = nx; pos.z = nz; }
}

/* ============================ ANIMATION LOOP ======================== */
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  stepTweens(dt);
  if (mode === 'overview') orbit.update();
  else updateWalk(dt);
  stepMachines(dt);
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

function stepMachines(dt) {
  /* ---- CT ---- */
  if (RIG.ctCouch) {
    RIG.ctCouch.position.z = RIG.ctCouchBaseZ + M.ct.couchZ;
  }
  if (M.ct.scanning && RIG.ctSpin) {
    M.ct.gantrySpin += dt * 6;
    // drive couch slowly through bore during scan
    M.ct.couchZ -= dt * 0.7 * M.ct.scanDir;
    const s = document.getElementById('ctCouch');
    if (s) { s.value = M.ct.couchZ; const v = document.getElementById('ctCouchv'); if (v) v.textContent = M.ct.couchZ.toFixed(1); }
    if (M.ct.couchZ <= -3.6 || M.ct.couchZ >= 0.2) { M.ct.scanning = false; setScanBtn(false); toast('CT scan complete'); }
  } else if (M.ct.spinning && RIG.ctSpin) {
    M.ct.gantrySpin += dt * 5;            // manual spin, no couch motion
  }
  if (RIG.ctSpin) RIG.ctSpin.rotation.z = M.ct.gantrySpin;
  if (RIG.ctLasers) RIG.ctLasers.visible = M.ct.lasers;

  /* ---- LINAC gantry ---- */
  if (RIG.linacGantry) {
    if (M.linac.gantryArc) {
      M.linac.gantry += dt * 28;             // continuous arc
      if (M.linac.gantry >= 360) M.linac.gantry -= 360;
    } else {
      // ease to target
      let d = M.linac.gantryTarget - M.linac.gantry;
      if (Math.abs(d) > 0.1) M.linac.gantry += d * Math.min(1, dt * 4);
    }
    RIG.linacGantry.rotation.z = THREE.MathUtils.degToRad(M.linac.gantry);
  }
  if (RIG.linacHead) RIG.linacHead.rotation.y = THREE.MathUtils.degToRad(M.linac.coll);
  // jaws -> field size
  if (RIG.jx1) {
    const fx = M.linac.jawX / 20, fy = M.linac.jawY / 20;   // 10cm -> 0.5 half-open
    RIG.jx1.position.z = fy + 0.06; RIG.jx2.position.z = -fy - 0.06;
    RIG.jy1.position.x = fx + 0.06; RIG.jy2.position.x = -fx - 0.06;
    if (RIG.linacBeam) { RIG.linacBeam.scale.set(fx / 0.5, 1, fy / 0.5); }
  }
  // MLC retraction fraction
  if (RIG.mlcLeaves) {
    RIG.mlcLeaves.forEach((pair, i) => {
      const open = (M.linac.mlc / 100) * (0.12 + 0.04 * Math.sin(i * 1.3));
      pair[0].position.x = -0.25 - open; pair[1].position.x = 0.25 + open;
    });
  }
  // couch transforms
  if (RIG.linacLift) RIG.linacLift.position.y = 1.3 + M.linac.couchV;
  if (RIG.linacRot)  RIG.linacRot.rotation.y = THREE.MathUtils.degToRad(M.linac.couchRot);
  if (RIG.linacTop)  RIG.linacTop.position.set(M.linac.couchLat, 0, M.linac.couchL);
  // beam + epid + beacon
  if (RIG.linacBeam) RIG.linacBeam.visible = M.linac.beam;
  if (RIG.linacEPID) RIG.linacEPID.forEach(c => c.visible = M.linac.epid);
  if (M.linac.beam) {
    M.linac.mu += dt * 200;
    if (M.linac.mu >= M.linac.muTarget) { M.linac.mu = M.linac.muTarget; setBeam(false); toast('Treatment delivered — beam off'); }
    if (RIG.linacBeacon) RIG.linacBeacon.material.emissive.setHex(Math.floor(performance.now() / 250) % 2 ? 0xff2200 : 0x110000);
    updateReadouts();
  } else if (RIG.linacBeacon) {
    RIG.linacBeacon.material.emissive.setHex(0x000000);
  }
  if (RIG.linacLasers) RIG.linacLasers.visible = true;

  /* ---- Physics chamber ---- */
  if (RIG.physChamber) RIG.physChamber.position.y = RIG.physChamberTopY - M.phys.chamberDepth * 0.14;
  if (M.phys.scanning) {
    M.phys.chamberDepth += dt * 2;
    M.phys.reading = Math.max(0, 100 * Math.exp(-(M.phys.chamberDepth - 1.5) * 0.16) * (1 + 0.4 * Math.min(1, M.phys.chamberDepth / 1.5)));
    const sl = document.getElementById('physDepth'); if (sl) sl.value = M.phys.chamberDepth;
    if (M.phys.chamberDepth >= 9) { M.phys.scanning = false; toast('Depth-dose scan complete'); }
    updatePhysReadout();
  }

  /* ---- Exam table ---- */
  if (RIG.examLift) {
    const target = M.exam.tableUp ? 1.35 : 0.95;
    RIG.examLift.position.y += (target - RIG.examLift.position.y) * Math.min(1, dt * 4);
  }

  updateReadouts();
}

/* ============================ UI PANELS ============================== */
const $ = s => document.querySelector(s);
function buildPanel(r) {
  $('#panelKicker').textContent = r.kicker;
  $('#panelTitle').textContent = r.name;
  $('#panelDesc').textContent = r.desc;
  const body = $('#panelBody');
  body.innerHTML = PANELS[r.id] ? PANELS[r.id]() : '';
  bindPanel(r.id);
  syncControls(r.id);
}

const slider = (id, lab, min, max, val, step, unit = '') =>
  `<div class="slider"><div class="lab"><span>${lab}</span><b><span id="${id}v">${val}</span>${unit}</b></div>
   <input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}"></div>`;

const PANELS = {
  lobby: () => `
    <div class="grp"><div class="gt">Reception</div>
      <div class="note">The lobby is the patient's first stop — check-in, scheduling and a calm waiting space before consultation and imaging.</div>
    </div>
    <div class="grp"><div class="gt">Patient Flow</div>
      <div class="procbtn" data-go="exam"><div class="pn">→ Send to Exam Room</div><div class="pd">Begin the consult & assessment step.</div></div>
      <div class="procbtn" data-go="ct"><div class="pn">→ Send to CT Simulation</div><div class="pd">Acquire planning images & set isocenter.</div></div>
      <div class="procbtn" data-go="vault"><div class="pn">→ Send to LINAC Vault</div><div class="pd">Deliver the planned treatment.</div></div>
    </div>`,

  exam: () => `
    <div class="grp"><div class="gt">Exam Table</div>
      <div class="btnrow"><button class="b" data-act="examToggle">Raise / Lower Table</button></div>
      <div class="note">Position the patient comfortably for physician assessment before simulation.</div>
    </div>
    <div class="grp"><div class="gt">Common Steps</div>
      <div class="procbtn" data-act="examProc"><div class="pn">Pre-sim consult</div><div class="pd">Raise the table, position patient, review treatment intent.</div></div>
    </div>`,

  ct: () => `
    <div class="grp"><div class="gt">Couch (Table)</div>
      <div class="btnrow"><button class="b" data-hold="ctIn">◄ In</button><button class="b" data-hold="ctOut">Out ►</button></div>
      ${slider('ctCouch','Longitudinal', -3.6, 0.4, M.ct.couchZ.toFixed(1), 0.05, ' m')}
    </div>
    <div class="grp"><div class="gt">Scan & Gantry</div>
      <div class="btnrow"><button class="b primary" data-act="ctScan">Start Scan</button><button class="b danger" data-act="ctStop">Stop</button></div>
      <div class="btnrow one"><button class="b" data-act="ctSpin">Toggle Gantry Spin</button></div>
    </div>
    <div class="grp"><div class="gt">Alignment</div>
      <div class="chk"><input type="checkbox" id="ctLasers" ${M.ct.lasers?'checked':''}><label for="ctLasers">Positioning lasers</label></div>
    </div>
    <div class="grp"><div class="gt">Procedures</div>
      <div class="procbtn" data-act="ctTopo"><div class="pn">Topogram (scout)</div><div class="pd">Drive couch to bore, short low-dose localizer.</div></div>
      <div class="procbtn" data-act="ctFull"><div class="pn">Planning CT</div><div class="pd">Full helical acquisition through the region of interest.</div></div>
      <div class="procbtn" data-act="ctIso"><div class="pn">Mark isocenter</div><div class="pd">Center couch at the laser crosshair and tattoo reference.</div></div>
    </div>`,

  phys: () => `
    <div class="grp"><div class="gt">Water Phantom</div>
      ${slider('physDepth','Chamber depth', 0, 9, M.phys.chamberDepth.toFixed(1), 0.1, ' cm')}
      <div class="btnrow"><button class="b primary" data-act="physScan">Depth-Dose Scan</button><button class="b" data-act="physReset">Reset</button></div>
    </div>
    <div class="grp"><div class="gt">Electrometer</div>
      <div class="read"><div class="row"><span>Reading</span><b id="physRead">0.0 %</b></div>
        <div class="row"><span>Depth</span><b id="physReadD">0.0 cm</b></div>
        <div class="row"><span>Status</span><b id="physStat">Idle</b></div></div>
    </div>
    <div class="grp"><div class="gt">Procedures</div>
      <div class="procbtn" data-act="physPDD"><div class="pn">Measure PDD</div><div class="pd">Lower chamber and record percent depth-dose curve.</div></div>
      <div class="note">Used for machine QA, beam calibration and treatment-planning data.</div>
    </div>`,

  vault: () => `
    <div class="grp"><div class="gt">Gantry</div>
      ${slider('lGantry','Angle', 0, 360, Math.round(M.linac.gantry), 1, '°')}
      <div class="btnrow three"><button class="b" data-set="g0">0°</button><button class="b" data-set="g90">90°</button><button class="b" data-set="g270">270°</button></div>
      <div class="btnrow"><button class="b" data-set="g180">180°</button><button class="b" data-act="lArc">Arc Spin</button></div>
    </div>
    <div class="grp"><div class="gt">Collimator & Field</div>
      ${slider('lColl','Collimator', -90, 90, Math.round(M.linac.coll), 1, '°')}
      ${slider('lJawX','Jaw X', 2, 20, M.linac.jawX, 0.5, ' cm')}
      ${slider('lJawY','Jaw Y', 2, 20, M.linac.jawY, 0.5, ' cm')}
      ${slider('lMLC','MLC aperture', 0, 100, M.linac.mlc, 1, ' %')}
    </div>
    <div class="grp"><div class="gt">Treatment Couch</div>
      ${slider('lCv','Vertical', -0.6, 0.6, M.linac.couchV.toFixed(2), 0.02, ' m')}
      ${slider('lClat','Lateral', -1, 1, M.linac.couchLat.toFixed(2), 0.02, ' m')}
      ${slider('lClng','Longitudinal', -1.5, 1.5, M.linac.couchL.toFixed(2), 0.02, ' m')}
      ${slider('lCrot','Couch angle', -90, 90, Math.round(M.linac.couchRot), 1, '°')}
    </div>
    <div class="grp"><div class="gt">Beam Delivery</div>
      ${slider('lMU','Monitor units', 50, 500, M.linac.muTarget||200, 10, ' MU')}
      <div class="btnrow"><button class="b on" data-act="lBeam" id="lBeamBtn">Beam On</button><button class="b danger" data-act="lBeamOff">Stop</button></div>
      <div class="chk"><input type="checkbox" id="lEpid" ${M.linac.epid?'checked':''}><label for="lEpid">Deploy EPID imager</label></div>
    </div>
    <div class="grp"><div class="gt">Procedures</div>
      <div class="procbtn" data-act="pSetup"><div class="pn">Patient setup</div><div class="pd">Couch to treatment height, gantry to 0°, align lasers.</div></div>
      <div class="procbtn" data-act="pBox"><div class="pn">4-field box</div><div class="pd">Sequential AP / PA / Lateral beams to isocenter.</div></div>
      <div class="procbtn" data-act="pVMAT"><div class="pn">VMAT arc</div><div class="pd">Dynamic arc delivery with continuous gantry rotation.</div></div>
      <div class="procbtn" data-act="pPortal"><div class="pn">Portal imaging</div><div class="pd">Deploy EPID and acquire a verification image.</div></div>
    </div>`
};

/* sync slider/checkbox displays to state on (re)build */
function syncControls(id) {
  const setv = (sid, v) => { const e = document.getElementById(sid + 'v'); if (e) e.textContent = v; };
  if (id === 'ct') { setv('ctCouch', M.ct.couchZ.toFixed(1)); }
  if (id === 'phys') { setv('physDepth', M.phys.chamberDepth.toFixed(1)); updatePhysReadout(); }
  if (id === 'vault') {
    setv('lGantry', Math.round(M.linac.gantry)); setv('lColl', Math.round(M.linac.coll));
    setv('lJawX', M.linac.jawX); setv('lJawY', M.linac.jawY); setv('lMLC', M.linac.mlc);
    setv('lCv', M.linac.couchV.toFixed(2)); setv('lClat', M.linac.couchLat.toFixed(2));
    setv('lClng', M.linac.couchL.toFixed(2)); setv('lCrot', Math.round(M.linac.couchRot));
    setv('lMU', M.linac.muTarget || 200);
  }
}

/* ============================ BINDINGS =============================== */
let holdTimer = null;
function bindPanel(id) {
  const body = $('#panelBody');

  // navigation shortcuts
  body.querySelectorAll('[data-go]').forEach(el =>
    el.onclick = () => { const r = roomById(el.dataset.go); focusRoom(r); });

  // hold-to-move buttons (couch in/out)
  body.querySelectorAll('[data-hold]').forEach(el => {
    const act = el.dataset.hold;
    const start = () => { holdMove(act); holdTimer = setInterval(() => holdMove(act), 60); };
    const stop = () => { clearInterval(holdTimer); };
    el.onmousedown = start; el.onmouseup = stop; el.onmouseleave = stop;
    el.ontouchstart = e => { e.preventDefault(); start(); }; el.ontouchend = stop;
  });

  // sliders
  bindSlider('ctCouch', v => { M.ct.couchZ = +v; });
  bindSlider('physDepth', v => { M.phys.chamberDepth = +v; M.phys.reading = pdd(M.phys.chamberDepth); updatePhysReadout(); });
  bindSlider('lGantry', v => { M.linac.gantryArc = false; M.linac.gantry = M.linac.gantryTarget = +v; }, '°');
  bindSlider('lColl', v => { M.linac.coll = +v; }, '°');
  bindSlider('lJawX', v => { M.linac.jawX = +v; updateReadouts(); }, ' cm');
  bindSlider('lJawY', v => { M.linac.jawY = +v; updateReadouts(); }, ' cm');
  bindSlider('lMLC', v => { M.linac.mlc = +v; }, ' %');
  bindSlider('lCv', v => { M.linac.couchV = +v; }, ' m', 2);
  bindSlider('lClat', v => { M.linac.couchLat = +v; }, ' m', 2);
  bindSlider('lClng', v => { M.linac.couchL = +v; }, ' m', 2);
  bindSlider('lCrot', v => { M.linac.couchRot = +v; }, '°');
  bindSlider('lMU', v => { M.linac.muTarget = +v; }, ' MU');

  // checkboxes
  const cl = document.getElementById('ctLasers'); if (cl) cl.onchange = e => M.ct.lasers = e.target.checked;
  const ep = document.getElementById('lEpid'); if (ep) ep.onchange = e => M.linac.epid = e.target.checked;

  // action buttons + presets
  body.querySelectorAll('[data-act]').forEach(el => el.onclick = () => doAction(el.dataset.act));
  body.querySelectorAll('[data-set]').forEach(el => el.onclick = () => doSet(el.dataset.set));
}
function bindSlider(id, fn, unit = '', dec = null) {
  const el = document.getElementById(id); if (!el) return;
  el.oninput = e => {
    const v = e.target.value;
    document.getElementById(id + 'v').textContent = dec != null ? (+v).toFixed(dec) : v;
    fn(v); updateReadouts();
  };
}
function holdMove(act) {
  if (act === 'ctIn') M.ct.couchZ = Math.max(-3.6, M.ct.couchZ - 0.05);
  if (act === 'ctOut') M.ct.couchZ = Math.min(0.4, M.ct.couchZ + 0.05);
  const s = document.getElementById('ctCouch'); if (s) { s.value = M.ct.couchZ; document.getElementById('ctCouchv').textContent = M.ct.couchZ.toFixed(1); }
}

function doSet(k) {
  M.linac.gantryArc = false;
  const map = { g0: 0, g90: 90, g180: 180, g270: 270 };
  M.linac.gantryTarget = map[k];
  const s = document.getElementById('lGantry'); if (s) { s.value = map[k]; document.getElementById('lGantryv').textContent = map[k]; }
  toast(`Gantry → ${map[k]}°`);
}

function doAction(a) {
  switch (a) {
    /* CT */
    case 'ctScan': startCTScan(false); break;
    case 'ctStop': M.ct.scanning = false; setScanBtn(false); toast('Scan stopped'); break;
    case 'ctSpin': M.ct.spinning = !M.ct.spinning; toast(M.ct.spinning ? 'Gantry spinning' : 'Gantry stopped'); break;
    case 'ctTopo': M.ct.couchZ = 0.2; startCTScan(true); toast('Acquiring topogram…'); break;
    case 'ctFull': M.ct.couchZ = 0.2; startCTScan(false); toast('Planning CT in progress…'); break;
    case 'ctIso': M.ct.couchZ = -1.7; M.ct.lasers = true;
      const c = document.getElementById('ctLasers'); if (c) c.checked = true; toast('Isocenter marked at laser crosshair'); break;
    /* Physics */
    case 'physScan': case 'physPDD': M.phys.chamberDepth = 0; M.phys.scanning = true; toast('Scanning depth dose…'); break;
    case 'physReset': M.phys.scanning = false; M.phys.chamberDepth = 0; M.phys.reading = pdd(0);
      const pd = document.getElementById('physDepth'); if (pd) { pd.value = 0; document.getElementById('physDepthv').textContent = '0.0'; }
      updatePhysReadout(); break;
    /* Exam */
    case 'examToggle': case 'examProc': M.exam.tableUp = !M.exam.tableUp;
      toast(M.exam.tableUp ? 'Table raised' : 'Table lowered'); break;
    /* LINAC */
    case 'lBeam': beamOn(); break;
    case 'lBeamOff': setBeam(false); toast('Beam stopped'); break;
    case 'lArc': M.linac.gantryArc = !M.linac.gantryArc; toast(M.linac.gantryArc ? 'Gantry arc spinning' : 'Arc stopped'); break;
    /* LINAC procedures */
    case 'pSetup': linacSetup(); break;
    case 'pBox': run4Field(); break;
    case 'pVMAT': runVMAT(); break;
    case 'pPortal': runPortal(); break;
  }
}

/* ---- CT scan ---- */
function startCTScan(topo) {
  M.ct.spinning = false;
  M.ct.scanDir = 1; M.ct.scanning = true; setScanBtn(true);
}
function setScanBtn(on) {
  const b = document.querySelector('[data-act="ctScan"]'); if (b) { b.textContent = on ? 'Scanning…' : 'Start Scan'; b.classList.toggle('toggled', on); }
}

/* ---- Physics PDD model ---- */
function pdd(d) { return Math.max(0, 100 * Math.exp(-(d - 1.5) * 0.16) * (1 + 0.4 * Math.min(1, d / 1.5))); }
function updatePhysReadout() {
  const r = document.getElementById('physRead'); if (!r) return;
  M.phys.reading = pdd(M.phys.chamberDepth);
  r.textContent = M.phys.reading.toFixed(1) + ' %';
  document.getElementById('physReadD').textContent = M.phys.chamberDepth.toFixed(1) + ' cm';
  document.getElementById('physStat').textContent = M.phys.scanning ? 'Scanning' : 'Idle';
}

/* ---- LINAC beam ---- */
function beamOn() {
  if (M.linac.beam) return;
  M.linac.mu = 0; M.linac.muTarget = M.linac.muTarget || 200;
  setBeam(true); toast(`Beam ON — delivering ${M.linac.muTarget} MU`);
}
function setBeam(on) {
  M.linac.beam = on;
  const pill = document.getElementById('beamPill');
  pill.textContent = on ? 'BEAM ON' : 'BEAM OFF'; pill.classList.toggle('on', on);
  const b = document.getElementById('lBeamBtn'); if (b) { b.textContent = on ? 'Delivering…' : 'Beam On'; }
}

/* ============================ PROCEDURES (LINAC) ===================== */
function step(fn, delay) { setTimeout(fn, delay); }
function linacSetup() {
  M.linac.gantryArc = false; M.linac.gantryTarget = 0; M.linac.couchV = 0.15;
  M.linac.couchLat = 0; M.linac.couchL = 0; M.linac.couchRot = 0;
  if (selectedRoom?.id === 'vault') buildPanel(selectedRoom);
  toast('Patient setup: gantry 0°, lasers aligned');
}
function run4Field() {
  M.linac.gantryArc = false; M.linac.jawX = 12; M.linac.jawY = 12;
  const angles = [0, 90, 180, 270]; let i = 0;
  toast('4-field box: starting AP beam');
  const fire = () => {
    if (i >= angles.length) { toast('4-field box complete'); return; }
    M.linac.gantryTarget = angles[i];
    step(() => { M.linac.muTarget = 100; beamOn(); }, 1100);
    step(() => { i++; fire(); }, 2700);
  };
  fire();
}
function runVMAT() {
  M.linac.gantryArc = true; M.linac.mlc = 60; M.linac.jawX = 14; M.linac.jawY = 14;
  M.linac.muTarget = 360; beamOn();
  toast('VMAT arc: dynamic delivery');
  step(() => { M.linac.gantryArc = false; }, 6000);
}
function runPortal() {
  M.linac.epid = true; const ep = document.getElementById('lEpid'); if (ep) ep.checked = true;
  M.linac.gantryTarget = 0; M.linac.muTarget = 60;
  step(() => beamOn(), 800);
  toast('Portal imaging: EPID deployed');
}

/* ============================ READOUTS / TOAST ====================== */
function updateReadouts() {
  document.getElementById('tGantry').textContent = Math.round(M.linac.gantry) + '°';
  document.getElementById('tColl').textContent = Math.round(M.linac.coll) + '°';
  document.getElementById('tCv').textContent = M.linac.couchV.toFixed(2);
  document.getElementById('tCl').textContent = M.linac.couchL.toFixed(2);
  document.getElementById('tField').textContent = `${M.linac.jawX}×${M.linac.jawY}`;
  document.getElementById('tMU').textContent = Math.round(M.linac.mu);
}
let toastT = null;
function toast(html) {
  const t = document.getElementById('toast'); t.innerHTML = html; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ============================ ROOM CARDS ============================ */
function buildRoomCards() {
  const host = document.getElementById('rooms');
  ROOMS.forEach(r => {
    const c = document.createElement('button');
    c.className = 'roomcard'; c.dataset.id = r.id; c.style.setProperty('--rc', r.col);
    c.innerHTML = `<span class="dot"></span><span><span class="nm">${r.name}</span><span class="sb">${r.kicker}</span></span>`;
    c.onclick = () => focusRoom(r);
    host.appendChild(c);
  });
}

/* ============================ PICKING =============================== */
const raycaster = new THREE.Raycaster();
function onCanvasClick(e) {
  if (mode !== 'overview') return;
  const ndc = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  for (const h of hits) {
    let o = h.object;
    while (o) { if (o.userData.roomId) { focusRoom(roomById(o.userData.roomId)); return; } o = o.parent; }
  }
  // fall back: nearest room to hit point on ground
  const ground = hits.find(h => Math.abs(h.point.y) < 0.3);
  if (ground) {
    let best = null, bd = 1e9;
    ROOMS.forEach(r => { const d = (r.x - ground.point.x) ** 2 + (r.z - ground.point.z) ** 2; if (d < bd) { bd = d; best = r; } });
    if (best && bd < 200) focusRoom(best);
  }
}

/* ============================ INPUT ================================= */
function bindGlobalInput() {
  document.querySelectorAll('#modeSeg button').forEach(b => b.onclick = () => setMode(b.dataset.mode));

  addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'Shift') keys['shift'] = true;
  });
  addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
    if (e.key === 'Shift') keys['shift'] = false;
  });
  canvas.addEventListener('click', e => { if (mode === 'walk') canvas.requestPointerLock?.(); else onCanvasClick(e); });
  document.addEventListener('pointerlockchange', () => { player.locked = document.pointerLockElement === canvas; });
  document.addEventListener('mousemove', e => {
    if (player.locked && mode === 'walk') {
      player.yaw -= e.movementX * 0.0024;
      player.pitch = Math.max(-1.2, Math.min(1.2, player.pitch - e.movementY * 0.0024));
    }
  });
  addEventListener('resize', onResize);
}
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

/* ============================ INIT ================================== */
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c1014);
  scene.fog = new THREE.Fog(0x0c1014, 70, 150);
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(8, 46, 52);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:40;';
  document.body.appendChild(labelRenderer.domElement);

  orbit = new OrbitControls(camera, canvas);
  orbit.enableDamping = true; orbit.dampingFactor = 0.08;
  orbit.target.set(8, 1, 0); orbit.maxPolarAngle = Math.PI / 2.05;
  orbit.minDistance = 6; orbit.maxDistance = 110;

  buildMaterials();
  buildBuilding();
  buildLobby(); buildExam(); buildCT(); buildPhysics(); buildLinac();

  buildRoomCards();
  bindGlobalInput();
  updateReadouts();

  animate();
  requestAnimationFrame(() => document.getElementById('loader').classList.add('hidden'));
}
init();
