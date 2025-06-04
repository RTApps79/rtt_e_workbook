// tps_main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let camera, scene, renderer, controls;
let gantryGroup, couchGroup, jaws;

export function initTPSInterface() {
  const root = document.getElementById('appRoot');
  root.innerHTML = `
    <div style="display: flex; height: 100vh">
      <div style="width: 40%; padding: 10px; background: #f4f4f4">
        <h2>2D Treatment Planning</h2>
        <label>Beam Angle: <input type="range" id="angleInput" min="0" max="360" value="180"></label><br>
        <label>Field Size X: <input type="range" id="fieldX" min="1" max="30" value="10"></label><br>
        <label>Field Size Y: <input type="range" id="fieldY" min="1" max="30" value="10"></label><br>
        <label>Weight: <input type="range" id="weightInput" min="0" max="100" value="50"></label><br>
        <button id="runPlan">Run Treatment Plan</button>
      </div>
      <div id="canvasContainer" style="flex: 1; position: relative;"></div>
    </div>
  `;
  initThreeJS();
  document.getElementById('runPlan').onclick = runPlan;
}

function initThreeJS() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth * 0.6 / window.innerHeight, 0.1, 100);
  camera.position.set(5, 5, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth * 0.6, window.innerHeight);
  document.getElementById('canvasContainer').appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x888888));

  // Gantry group
  gantryGroup = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 4), new THREE.MeshStandardMaterial({ color: 0x6699ff }));
  base.position.z = 2;
  gantryGroup.add(base);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0x0033cc }));
  arm.position.set(1.2, 0, 3.8);
  gantryGroup.add(arm);

  jaws = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
  jaws.position.set(2.4, 0, 3.8);
  gantryGroup.add(jaws);

  scene.add(gantryGroup);

  // Couch
  couchGroup = new THREE.Group();
  const table = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 0.2), new THREE.MeshStandardMaterial({ color: 0x444444 }));
  table.position.y = -1.5;
  couchGroup.add(table);
  scene.add(couchGroup);

  // Phantom
  const phantom = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.5, 32), new THREE.MeshStandardMaterial({ color: 0xbbbbbb }));
  phantom.position.set(0, -1.2, 0);
  scene.add(phantom);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function runPlan() {
  const angle = parseFloat(document.getElementById('angleInput').value);
  const fieldX = parseFloat(document.getElementById('fieldX').value);
  const fieldY = parseFloat(document.getElementById('fieldY').value);
  const weight = parseFloat(document.getElementById('weightInput').value);

  rotateGantry(angle);
  adjustJaws(fieldX, fieldY);
  simulateBeam(weight);
}

function rotateGantry(deg) {
  gantryGroup.rotation.z = THREE.MathUtils.degToRad(deg);
}

function adjustJaws(x, y) {
  jaws.scale.set(x / 10, y / 10, 1);
}

function simulateBeam(weight) {
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 5, 16),
    new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: Math.min(weight / 100, 1) })
  );
  beam.rotation.x = Math.PI / 2;
  beam.position.set(2.4, 0, 2.8);
  scene.add(beam);
  setTimeout(() => scene.remove(beam), 1000);
}

initTPSInterface();
