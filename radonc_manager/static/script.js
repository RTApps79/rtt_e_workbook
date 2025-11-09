// This file replaces your 'Game.run()' loop and 'handle_events()'

let selectedPatientId = null;
let gameState = {}; // Will hold the state from the backend

// --- 1. CORE FUNCTIONS ---

/**
 * Fetches the latest game state from the Python/Flask backend
 * and then calls renderAll() to update the screen.
 */
async function fetchGameState() {
    try {
        const response = await fetch('/api/game_state');
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        gameState = await response.json();
        renderAll();
    } catch (error) {
        console.error("Error fetching game state:", error);
        // Show a user-friendly error on the page
        document.getElementById('patient-list').innerHTML = 
            `<div class="error-message">
                <strong>Connection Error!</strong><br>
                Could not connect to the Python backend.<br>
                Did you run 'flask run' in your terminal?
            </div>`;
    }
}

/**
 * Re-draws the entire UI based on the new game state.
 * This is the replacement for your pygame 'draw()' function.
 */
function renderAll() {
    // Render HUD
    document.getElementById('hud-day').textContent = gameState.day;
    document.getElementById('hud-funds').textContent = gameState.funds;
    document.getElementById('hud-safety').textContent = gameState.safety.toFixed(1);

    // Render Patients
    const patientList = document.getElementById('patient-list');
    patientList.innerHTML = ''; // Clear list
    
    // Filter patients who are not 'COMPLETE'
    const activePatients = gameState.patients.filter(p => p.queue_status !== "COMPLETE");

    activePatients.forEach(p => {
        // This 'div' is the patient card, replacing pygame.draw.rect()
        const patientDiv = document.createElement('div');
        patientDiv.className = 'patient-card';
        if (p.patient_id === selectedPatientId) {
            patientDiv.classList.add('selected');
        }
        
        // This is the "Patient-Gateway" link!
        patientDiv.innerHTML = `
            <div class="patient-name">${p.name} (${p.diagnosis})</div>
            <div class="patient-status">${p.fractions_done}/${p.total_fractions} - ${p.queue_status}</div>
            <button class="emr-button" data-patient-id="${p.patient_id}">View EMR</button>
        `;
        
        // Add click event to select the patient
        patientDiv.addEventListener('click', (e) => {
            if (!e.target.classList.contains('emr-button')) {
                selectedPatientId = p.patient_id;
                renderAll(); // Re-render to show selection
            }
        });
        patientList.appendChild(patientDiv);
    });

    // Render Machines (CT and LINACs)
    const ctList = document.getElementById('ct-sim-list');
    const linacList = document.getElementById('linac-list');
    ctList.innerHTML = '';
    linacList.innerHTML = '';

    gameState.machines.forEach(m => {
        const machineDiv = document.createElement('div');
        machineDiv.className = 'machine';
        let slotsHtml = '';

        m.schedule.forEach((patientId, index) => {
            if (patientId) {
                // Slot is occupied
                const p = gameState.patients.find(pat => pat.patient_id === patientId);
                // Handle cases where patient might be missing (e.g., error)
                const patientName = p ? `${p.name} (${p.fractions_remaining} fx left)` : 'Assigned (Error)';
                slotsHtml += `<div class="slot occupied">${patientName}</div>`;
            } else {
                // Slot is empty - make it clickable
                slotsHtml += `<div class="slot empty" data-machine-name="${m.name}" data-slot-index="${index}">[ EMPTY ]</div>`;
            }
        });

        machineDiv.innerHTML = `
            <div class="machine-title">${m.name} (${m.status})</div>
            <div class="slots-container">${slotsHtml}</div>
        `;

        if (m.machine_type === 'CT_SIM') {
            ctList.appendChild(machineDiv);
        } else {
            linacList.appendChild(machineDiv);
        }
    });
}

// --- 2. EVENT HANDLERS (replaces handle_hotspot_click) ---

document.addEventListener('click', async (e) => {
    // Handle clicking an empty slot
    if (e.target.classList.contains('slot') && e.target.classList.contains('empty')) {
        if (!selectedPatientId) {
            alert("Select a patient first!");
            return;
        }
        
        const machineName = e.target.dataset.machineName;
        const slotIndex = parseInt(e.target.dataset.slotIndex, 10);
        
        // This is the API call to the Python backend
        const response = await fetch('/api/assign_to_machine', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                patient_id: selectedPatientId,
                machine_name: machineName,
                slot_index: slotIndex
            })
        });
        
        if (response.ok) {
            gameState = await response.json();
            selectedPatientId = null; // Deselect patient
            renderAll();
            
            // This is where you would launch a minigame
            if (machineName.includes("Linac")) {
                // We'll add this function in the next step
                // launchAlignmentMinigame(selectedPatientId); 
                console.log("Assigned to LINAC. Minigame would launch here.");
            }
            
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    }

    // Handle clicking the "View EMR" button
    if (e.target.classList.contains('emr-button')) {
        const patientId = e.target.dataset.patientId;
        openPatientEMR(patientId);
    }

    // Handle clicking "End Day"
    if (e.target.id === 'end-day-button') {
        if (confirm("Proceed to next day? This will deliver fractions and update finances.")) {
            const response = await fetch('/api/end_day', { method: 'POST' });
            gameState = await response.json();
            renderAll();
        }
    }
});

// --- 3. EMR & LAB INTEGRATION (Placeholder) ---

async function openPatientEMR(patientId) {
    const p = gameState.patients.find(pat => pat.patient_id === patientId);
    const emrContent = document.getElementById('emr-content-goes-here');
    
    // This is a placeholder. In the next step, we will actually
    // fetch the HTML content from your 'Rad Onc Daily EMR Patient Library' files.
    emrContent.innerHTML = `
        <h1>EMR: ${p.name}</h1>
        <p><strong>Diagnosis:</strong> ${p.diagnosis}</p>
        <p><strong>Prescription:</strong> ${p.prescription}</p>
        <hr>
        <p>This modal would contain the full, tabbed EMR interface from your HTML files.</p>
        <br>
        <button class_name="emr-button" onclick="launchContouringLab()">Launch Contouring Lab</button>
        <button class_name="emr-button" onclick="launchSimLab()">Launch CT Sim Lab</button>
    `;
    
    document.getElementById('emr-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('emr-modal').style.display = 'none';
}

function launchContouringLab() {
    alert("Launching 2D/3D Contouring Lab Visualizer...");
}

function launchSimLab() {
    // This is where we would load your 'CT Simulation Record Library' HTML
    alert("Launching CT Sim Parameter Lab...");
}


// --- INITIAL LOAD ---
// When the page finishes loading, call the backend to get the game state.
document.addEventListener('DOMContentLoaded', fetchGameState);
