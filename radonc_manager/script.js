// This file replaces your 'Game.run()' loop and 'handle_events()'

let selectedPatientId = null;
let gameState = {}; // Will hold the state from the backend

// --- 1. CORE FUNCTIONS ---

// Fetches the latest game state from the Python/Flask backend
async function fetchGameState() {
    try {
        const response = await fetch('/api/game_state');
        gameState = await response.json();
        renderAll();
    } catch (error) {
        console.error("Error fetching game state:", error);
    }
}

// Re-draws the entire UI based on the new game state
// This is the replacement for your main 'draw()' function
function renderAll() {
    // Render HUD
    document.getElementById('hud-day').textContent = gameState.day;
    document.getElementById('hud-funds').textContent = gameState.funds;
    document.getElementById('hud-safety').textContent = gameState.safety.toFixed(1);

    // Render Patients
    const patientList = document.getElementById('patient-list');
    patientList.innerHTML = ''; // Clear list
    gameState.patients.forEach(p => {
        // This 'div' is the patient card, replacing pygame.draw.rect()
        const patientDiv = document.createElement('div');
        patientDiv.className = 'patient-card';
        if (p.patient_id === selectedPatientId) {
            patientDiv.classList.add('selected');
        }
        // This is the Patient-Gateway link!
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
                slotsHtml += `<div class="slot occupied">${p.name} (${p.fractions_remaining} fx left)</div>`;
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
        const slotIndex = parseInt(e.target.dataset.slotIndex);
        
        // This is the API call to the backend
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
            
            // --- HERE we would launch the JS-version of your Alignment Minigame ---
            // if (machineName.includes("Linac")) {
            //     launchAlignmentMinigame(gameState.patients.find(p => ...));
            // }
            
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
        if (confirm("Proceed to next day?")) {
            const response = await fetch('/api/end_day', { method: 'POST' });
            gameState = await response.json();
            renderAll();
        }
    }
});

// --- 3. EMR & LAB INTEGRATION ---

async function openPatientEMR(patientId) {
    // In a real app, you'd fetch the specific EMR. Here, we'll just show a placeholder.
    // This is where you would load the content from your 'Rad Onc Daily EMR Patient Library' files
    const p = gameState.patients.find(pat => pat.patient_id === patientId);
    const emrContent = document.getElementById('emr-content-goes-here');
    
    // This is a simple example. You'd ideally fetch the HTML content
    // of "john_smith.html" or "maria_garcia.html" etc.
    emrContent.innerHTML = `
        <h1>EMR: ${p.name}</h1>
        <p><strong>Diagnosis:</strong> ${p.diagnosis}</p>
        <p><strong>Prescription:</strong> ${p.prescription}</p>
        <hr>
        <p>This modal would contain the full, tabbed EMR interface from your HTML files.</p>
        <button onclick="launchContouringLab()">Launch Contouring Lab</button>
    `;
    
    document.getElementById('emr-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('emr-modal').style.display = 'none';
}

function launchContouringLab() {
    alert("Launching 2D/3D Contouring Lab Visualizer... (This would be your JS lab activity)");
}

// --- INITIAL LOAD ---
document.addEventListener('DOMContentLoaded', fetchGameState);
