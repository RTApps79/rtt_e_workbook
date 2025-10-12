import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

document.addEventListener('DOMContentLoaded', () => {
    const hotspots = document.querySelectorAll('.hotspot');
    const modalOverlay = document.getElementById('modal-overlay');
    const modals = document.querySelectorAll('.modal');
    const seeInsideBtn = document.getElementById('see-inside-btn');
    const gantryCutaway = document.getElementById('gantry-cutaway');

    let isCouchSceneInitialized = false;

    // --- Modal Logic ---
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modalOverlay.classList.remove('hidden');
            modal.classList.remove('hidden');

            // Initialize 3D scene only when its modal is first opened
            if (modalId === 'couch-modal' && !isCouchSceneInitialized) {
                initCouch3D();
                isCouchSceneInitialized = true;
            }
        }
    }

    function hideModals() {
        modalOverlay.classList.add('hidden');
        modals.forEach(modal => modal.classList.add('hidden'));
        gantryCutaway.classList.add('hidden'); // Also hide gantry details
    }

    hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', () => {
            const modalId = hotspot.getAttribute('data-modal');
            showModal(modalId);
        });
    });

    modalOverlay.addEventListener('click', hideModals);
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', hideModals);
    });

    seeInsideBtn.addEventListener('click', () => {
        gantryCutaway.classList.toggle('hidden');
    });
    
    // --- Three.js Couch Scene ---
    function initCouch3D() {
        const container = document.getElementById('couch-3d-container');

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x222222);

        // Camera
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(2, 2, 3);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 2;
        controls.maxDistance = 10;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Couch Geometry
        const couchGeometry = new THREE.BoxGeometry(4, 0.2, 1.5);
        
        // Carbon Fiber-like Material
        const couchMaterial = new THREE.MeshStandardMaterial({
             color: 0x444444,
             metalness: 0.1,
             roughness: 0.4
        });
        const couchMesh = new THREE.Mesh(couchGeometry, couchMaterial);
        scene.add(couchMesh);

        // Animation Loop
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        }

        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            }
        });
    }
});
