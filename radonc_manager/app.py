# We keep the core classes and logic from radonc_managerv5.py
# We remove ALL pygame, sys, math, and textwrap imports
# We ADD 'flask'
from flask import Flask, jsonify, request
import random

# --- CONFIG (from pygame file) ---
REVENUE_PER_FRACTION = 1500
STAFF_SALARY_PER_DAY = 800
SUPPLY_COST_PER_PATIENT_PER_DAY = 100
DAILY_OVERHEAD = 1000

PATIENT_TEMPLATES = [
    {"id": "P1001", "name": "James Anderson", "diag": "Prostate Ca", "rx": "78 Gy / 39 fx", "fx_dose": 200, "tech": "IMRT", "urgency": "Standard"},
    {"id": "P1002", "name": "Maria Garcia", "diag": "L Breast Ca", "rx": "42.5 Gy / 16 fx", "fx_dose": 266, "tech": "3DCRT", "urgency": "Standard"},
    {"id": "P1003", "name": "David Lee", "diag": "NSCLC (RUL)", "rx": "54 Gy / 3 fx", "fx_dose": 1800, "tech": "SBRT", "urgency": "Standard"},
    # ... (all other templates) ...
]

# --- HELPERS (from pygame file) ---
def parse_fx_count(rx):
    try:
        parts = rx.split("/")
        fx_part = parts[-1].strip()
        fx_count = int(fx_part.replace("fx","").strip())
        return fx_count
    except: return 10

# --- ENTITIES (from pygame file) ---
# (Patient, Staff, Machine, StaffPool classes remain mostly the same,
# but without any pygame-related properties)

class Patient:
    def __init__(self, data):
        self.patient_id = data["id"]
        self.name = data["name"]
        self.diagnosis = data["diag"]
        self.prescription = data["rx"]
        self.total_fractions = parse_fx_count(self.prescription)
        self.fractions_remaining = self.total_fractions
        self.fractions_done = 0
        self.queue_status = "AWAITING_SIM" # QUEUE: AWAITING_SIM, IN_SIM, AWAITING_PLAN, ...
        self.allow_resim = False
        self.assigned_machine_slot = None # e.g., ("LINAC", "Linac 1", 0)
        self.assigned_pool_slot = None  # e.g., ("Dosimetry", 0)
        # ... (other properties) ...
    
    # We add a 'to_dict' method so Flask can send it as JSON
    def to_dict(self):
        return {
            "patient_id": self.patient_id,
            "name": self.name,
            "diagnosis": self.diagnosis,
            "prescription": self.prescription,
            "fractions_done": self.fractions_done,
            "total_fractions": self.total_fractions,
            "queue_status": self.queue_status,
            "allow_resim": self.allow_resim,
            "assigned_machine_slot": self.assigned_machine_slot
        }

class Machine:
    def __init__(self, name, mtype):
        self.name = name
        self.machine_type = mtype  # "CT_SIM" or "LINAC"
        self.status = "IDLE"
        self.capacity = 8 if mtype == "CT_SIM" else 6
        self.schedule = [None] * self.capacity # Will store patient_ids

    def get_next_open_slot(self):
        try: return self.schedule.index(None)
        except ValueError: return -1
    
    def to_dict(self):
        return {
            "name": self.name,
            "machine_type": self.machine_type,
            "status": self.status,
            "capacity": self.capacity,
            "schedule": self.schedule # List of patient_ids or None
        }

# --- GLOBAL GAME STATE ---
# This replaces the 'Game' class properties
game_state = {
    "day": 1,
    "funds": 50000,
    "safety": 100.0,
    "patients": [], # This will be a list of Patient objects
    "machines": [
        Machine("CT Simulator", "CT_SIM"),
        Machine("Linac 1", "LINAC"),
        Machine("Linac 2", "LINAC"),
    ]
    # ... (Staff, Pools would also be here) ...
}

# --- INITIALIZE GAME STATE ---
def init_game():
    # Add initial 5 patients
    for i in range(5):
        t = random.choice(PATIENT_TEMPLATES)
        pid = f"P{1001+i}"
        data = dict(t)
        data["id"] = pid
        data["name"] = f"{t['name']} ({pid})"
        game_state["patients"].append(Patient(data))

init_game() # Run this when the server starts

# ===================================================================
# 2. THE FLASK API (This is the NEW "merge" part)
# This replaces pygame.event.get() and handle_hotspot_click()
# ===================================================================

app = Flask(__name__)

# --- API Endpoint to GET the entire game state ---
@app.route('/api/game_state', methods=['GET'])
def get_game_state():
    # Convert all objects to dictionaries for JSON
    state_json = {
        "day": game_state["day"],
        "funds": game_state["funds"],
        "safety": game_state["safety"],
        "patients": [p.to_dict() for p in game_state["patients"]],
        "machines": [m.to_dict() for m in game_state["machines"]]
    }
    return jsonify(state_json)

# --- API Endpoint to assign a patient to a machine ---
@app.route('/api/assign_to_machine', methods=['POST'])
def api_assign_patient_to_machine():
    data = request.json
    patient_id = data.get('patient_id')
    machine_name = data.get('machine_name')
    slot_index = data.get('slot_index')
    
    # --- This is logic directly from your assign_patient_to_machine() ---
    try:
        patient = next(p for p in game_state["patients"] if p.patient_id == patient_id)
        machine = next(m for m in game_state["machines"] if m.name == machine_name)
    except StopIteration:
        return jsonify({"error": "Patient or machine not found"}), 404

    if machine.schedule[slot_index] is not None:
        return jsonify({"error": "Slot already occupied"}), 400

    # (Add your other logic from the pygame file here... 
    # e.g., check for AWAITING_TX status, allow_resim flag, etc.)

    # --- Assign patient ---
    machine.schedule[slot_index] = patient.patient_id
    patient.assigned_machine_slot = (machine.machine_type, machine.name, slot_index)
    
    if machine.machine_type == "CT_SIM":
        patient.queue_status = "IN_SIM"
        # In a real web app, we'd start a backend timer.
        # For simplicity, we'll just update the status.
        # The frontend can simulate the 3-second wait.
        
    elif machine.machine_type == "LINAC":
        patient.queue_status = "IN_TREATMENT"
        
    print(f"Assigned {patient.name} to {machine.name} slot {slot_index}")
    
    # Return the new game state
    return get_game_state()

# --- API Endpoint to run the "End of Day" logic ---
@app.route('/api/end_day', methods=['POST'])
def api_end_day():
    # --- This is logic directly from your end_day_confirmed() ---
    fractions_delivered = 0
    for m in game_state["machines"]:
        if m.machine_type == "LINAC":
            for i, patient_id in enumerate(m.schedule):
                if patient_id:
                    try:
                        p = next(pat for pat in game_state["patients"] if pat.patient_id == patient_id)
                        if p.queue_status == "IN_TREATMENT":
                            p.fractions_remaining -= 1
                            p.fractions_done += 1
                            fractions_delivered += 1
                            if p.fractions_remaining <= 0:
                                p.queue_status = "COMPLETE"
                                m.schedule[i] = None # Clear slot
                                p.assigned_machine_slot = None
                    except StopIteration:
                        m.schedule[i] = None # Patient not found, clear slot
    
    # ... (rest of your financial logic) ...
    daily_revenue = fractions_delivered * REVENUE_PER_FRACTION
    staff_cost = 7 * STAFF_SALARY_PER_DAY # Simplified from your code
    daily_profit = daily_revenue - (staff_cost + DAILY_OVERHEAD)
    game_state["funds"] += daily_profit
    
    # ... (Add new patients) ...
    
    game_state["day"] += 1
    
    # Return the new game state
    return get_game_state()

# --- Route to serve the main HTML file ---
@app.route('/')
def index():
    # This will send the 'index.html' file to the browser
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(debug=True)
