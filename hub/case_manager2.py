import os
import time
import random
import textwrap

# --- ARRT Content Citations ---
# [1] Patient Care - Medical Emergencies (e.g., seizures)
# [2] Patient Care - Blood studies (e.g., CBC)
# [3] Safety - Personnel Protection (ALARA) / Dose Limits
# [4] Safety - Quality Control Procedures
# [5] Safety - QC: Laser Alignment
# [6] Safety - QC: Radiation Output
# [7] Safety - QC: Evaluation & Action
# [8] Safety - Equipment Malfunctions
# [9] Procedures - Treatment Volume Localization (Simulation)
# [10] Procedures - Prescription (Total Dose, Fractions)
# [11] Procedures - Treatment Administration / Verification
# [12] Patient Care - Ethical & Legal (e.g., living will)
# [13] Procedures - Treatment Sites (e.g., palliative)

# --- Helper Functions (UI) ---

def clear_screen():
    """Clears the console screen."""
    os.system('cls' if os.name == 'nt' else 'clear')

def wrap_text(text, width=70):
    """Wraps text to the console width."""
    return '\n'.join(textwrap.wrap(text, width))

def show_modal(title, text, citation=""):
    """
    Simulates a UI modal. Pauses the game.
    """
    clear_screen()
    print("=" * 70)
    print(f"| {title.upper().center(66)} |")
    print("=" * 70)
    print("\n" + wrap_text(text) + "\n")
    if citation:
        print(wrap_text(f"Source: {citation}", width=68))
    print("-" * 70)
    input("\n[Press Enter to continue...]")

def show_prompt(title, text, options):
    """
    Simulates a choice modal. Returns the user's selected index.
    """
    clear_screen()
    print("=" * 70)
    print(f"| {title.upper().center(66)} |")
    print("=" * 70)
    print("\n" + wrap_text(text) + "\n")
    print("-" * 70)
    
    for i, option in enumerate(options):
        print(f"  [{i+1}] {option}")
        
    print("-" * 70)
    
    while True:
        try:
            choice = input(f"Enter your choice (1-{len(options)}): ")
            choice_index = int(choice) - 1
            if 0 <= choice_index < len(options):
                return choice_index
            else:
                print(f"Invalid choice. Please enter a number between 1 and {len(options)}.")
        except ValueError:
            print("Invalid input. Please enter a number.")

def show_loading(text, duration=2):
    """Simulates a task in progress."""
    print(f"\n{text}...", end='', flush=True)
    for _ in range(duration):
        time.sleep(0.5)
        print(".", end='', flush=True)
    print(" Complete.")
    time.sleep(0.5)

# --- Patient Templates ---
PATIENT_TEMPLATES = [
    {"name": "John Smith", "diag": "Prostate", "dose": 78, "fx": 39, "urgency": "Standard"},
    {"name": "Jane Doe", "diag": "Palliative Bone Met", "dose": 30, "fx": 10, "urgency": "URGENT"},
    {"name": "Mike Brown", "diag": "Lung (SBRT)", "dose": 54, "fx": 3, "urgency": "Standard"},
    {"name": "Emily White", "diag": "Breast", "dose": 50, "fx": 25, "urgency": "Standard"},
    {"name": "David Lee", "diag": "H&N", "dose": 70, "fx": 35, "urgency": "Standard"},
    {"name": "Maria Garcia", "diag": "Cord Compression", "dose": 8, "fx": 1, "urgency": "URGENT"},
]

# --- Game Object Classes ---

class Patient:
    """Represents a single patient and their treatment plan."""
    def __init__(self, name, diagnosis, total_dose, total_fractions, urgency="Standard"):
        self.name = name
        self.diagnosis = diagnosis
        self.total_dose = total_dose         # [cite: 10]
        self.total_fractions = total_fractions # [cite: 10]
        self.urgency = urgency # "Standard" or "URGENT" [cite: 13]
        self.fractions_done = 0
        self.treated_today = False
        # Statuses: WAITING_FOR_SIM, WAITING_FOR_TX, IN_TREATMENT, TREATMENT_COMPLETE
        self.status = "WAITING_FOR_SIM" 

    def __repr__(self):
        urgency_flag = " [! URGENT !]" if self.urgency == "URGENT" and self.status != "TREATMENT_COMPLETE" else ""
        return (f"{self.name} ({self.diagnosis}, {self.fractions_done}/{self.total_fractions} Fx) "
                f"- Status: {self.status}{urgency_flag}")

    def get_plan_summary(self):
        return f"Plan: {self.total_dose} Gy in {self.total_fractions} fractions."

class Staff:
    """Represents a staff member."""
    def __init__(self, name, role, salary):
        self.name = name
        self.role = role # "Therapist" or "Physicist"
        self.salary = salary # Daily cost
        self.occupational_dose = 0.0 # [cite: 3]
        self.dose_limit = 5.0 # Simplified monthly limit
        # Statuses: IDLE, BUSY, ON_LEAVE
        self.status = "IDLE"

    def __repr__(self):
        dose_percent = (self.occupational_dose / self.dose_limit) * 100
        return (f"{self.role} {self.name} (Dose: {dose_percent:.0f}% | Salary: ${self.salary}/day) "
                f"- Status: {self.status}")

    def add_dose(self, amount):
        if self.status != "ON_LEAVE":
            self.occupational_dose += amount
            if self.occupational_dose >= self.dose_limit:
                self.status = "ON_LEAVE"
                show_modal("STAFF DOSE LIMIT REACHED!",
                           f"{self.role} {self.name} has reached their monthly dose limit and is on mandatory paid leave!",
                           "ARRT Content: Safety - Personnel Protection / Dose Equivalent Limits [cite: 3]")

    def end_of_day_recovery(self):
        # Simulate dose "cooling off" over time (days off)
        if self.status == "ON_LEAVE":
            self.occupational_dose -= 1.0 # Recover
            if self.occupational_dose <= 0:
                self.occupational_dose = 0
                self.status = "IDLE"
                print(f"Staff Update: {self.name} has returned from dose leave.")

class Machine:
    """Represents a piece of equipment."""
    def __init__(self, name, machine_type):
        self.name = name
        self.machine_type = machine_type # "LINAC" or "CT_SIM"
        # Statuses: IDLE, IN_USE, DOWN_FOR_QA, BROKEN (UNCHECKED for skipped QA)
        self.status = "DOWN_FOR_QA"

    def __repr__(self):
        return f"{self.name} ({self.machine_type}) - Status: {self.status}"


# --- Main Game Class ---

class Game:
    """Manages the overall game state, scenes, and main loop."""
    def __init__(self):
        self.day = 1
        self.score = 0
        self.safety_rating = 100
        self.funds = 50000 # Starting budget
        
        self.staff_list = []
        self.machine_list = []
        self.patient_queue = []
        
        self.current_scene = self.scene_main_menu # Start at the main hub
        self.game_over = False

    def get_staff_by_role(self, role, status="IDLE"):
        """Utility to find available staff."""
        return [s for s in self.staff_list if s.role == role and s.status == status]

    def get_machine(self, name):
        """Utility to find a specific machine."""
        return next((m for m in self.machine_list if m.name == name), None)

    def set_staff_status(self, staff_list, new_status):
        """Helper to set status for a group of staff."""
        for staff in staff_list:
            staff.status = new_status
            
    def modify_funds(self, amount, reason=""):
        """Modifies game funds and prints a reason."""
        self.funds += amount
        if amount > 0:
            print(f"Revenue: +${amount} ({reason})")
        elif amount < 0:
            print(f"Expense: -${abs(amount)} ({reason})")
        
        if self.funds <= 0:
            show_modal("GAME OVER: BANKRUPTCY!",
                       f"Your department has run out of money and is being shut down.\n"
                       f"Final Score: {self.score}", "")
            self.game_over = True
            
        time.sleep(0.5)

    def update_hud(self):
        """Prints the main game HUD."""
        print("-" * 70)
        print(f"| DAY: {self.day}  |  FUNDS: ${self.funds}  |  SCORE: {self.score}  |  SAFETY: {self.safety_rating}% |")
        print("-" * 70)

    def setup_game(self):
        """Initializes the game world with staff and machines."""
        self.staff_list = [
            Staff("Miller", "Therapist", 250),
            Staff("Chen", "Therapist", 250),
            Staff("Garcia", "Therapist", 250),
            Staff("Dr. Evans", "Physicist", 400)
        ]
        self.machine_list = [
            Machine("CT Simulator", "CT_SIM"),
            Machine("Linac 1", "LINAC"),
            Machine("Linac 2", "LINAC")
        ]
        # Add the first two patients
        pt_data = PATIENT_TEMPLATES[0]
        self.patient_queue.append(Patient(pt_data["name"], pt_data["diag"], pt_data["dose"], pt_data["fx"], pt_data["urgency"]))
        pt_data = PATIENT_TEMPLATES[1]
        self.patient_queue.append(Patient(pt_data["name"], pt_data["diag"], pt_data["dose"], pt_data["fx"], pt_data["urgency"]))
    
    def run(self):
        """The main game loop."""
        clear_screen()
        show_modal("Welcome, RadOnc Manager!",
                   "You are the new manager of the radiation oncology department. "
                   "Your job is to treat patients safely, manage your staff, and keep an eye on the budget. "
                   "Your first day is about to begin.",
                   "Based on ARRT Examination Content Specifications")
        
        self.start_day()
        
        while not self.game_over:
            try:
                # The current_scene function is called, and it returns
                # the function for the next scene.
                next_scene_func = self.current_scene()
                self.current_scene = next_scene_func
                
                # Check for game over conditions
                if self.safety_rating <= 0:
                    show_modal("GAME OVER: ACCREDITATION LOST!",
                               "Your department's safety rating has fallen to 0%! "
                               "Your accreditation is revoked and the department is shut down.", "")
                    self.game_over = True
                elif len(self.get_staff_by_role("Therapist")) == 0:
                    show_modal("GAME OVER: NO STAFF!",
                               "All of your therapists are on mandatory dose leave! "
                               "You have no one to treat patients. The department is shut down.",
                               "ARRT Content: Personnel Protection [cite: 3]")
                    self.game_over = True

            except KeyboardInterrupt:
                print("\nExiting game...")
                self.game_over = True
            except Exception as e:
                print(f"\nAn unexpected error occurred: {e}")
                self.game_over = True

    def start_day(self):
        """Logic for the very start of a new day."""
        # Set all machines to require QA [cite: 4]
        for m in self.machine_list:
            if m.status != "BROKEN":
                m.status = "DOWN_FOR_QA"
        # Reset patient treated status
        for p in self.patient_queue:
            p.treated_today = False
        
        show_modal(f"Day {self.day} - Morning Briefing",
                   f"You have ${self.funds} in the bank.\n"
                   f"You have {len(self.patient_queue)} patients on the schedule. "
                   "All machines require mandatory morning QA before use. [cite: 4]",
                   "ARRT Content: Quality Control Procedures")
        
        self.run_morning_qa()

    def run_morning_qa(self):
        """The critical first choice: run or skip QA."""
        physicist = self.get_staff_by_role("Physicist", "IDLE")
        if not physicist:
            show_modal("QA Crisis!",
                       "Your physicist is not available (on leave?)! You cannot run QA! "
                       "You must skip, but this is a major safety violation.",
                       "ARRT Content: Personnel Management / QC Procedures")
            self.safety_rating -= 20
            for m in self.machine_list:
                m.status = "IDLE (UNCHECKED)"
            return

        physicist = physicist[0]
        
        machines_to_check = [m for m in self.machine_list if m.status == "DOWN_FOR_QA"]
        qa_cost = len(machines_to_check) * 100 # Cost for QA supplies
        
        choice = show_prompt("Morning QA",
                             f"Physicist {physicist.name} is ready for morning QA.\n"
                             f"This will cost ${qa_cost} in supplies.",
                             [f"Run QA Procedures (Cost: ${qa_cost})", f"Skip QA (RISKY, Free)"])
        
        if choice == 0: # Run QA
            self.modify_funds(-qa_cost, "QA Supplies")
            physicist.status = "BUSY"
            
            for machine in machines_to_check:
                show_loading(f"Running QA on {machine.name}", duration=1)
                
                # Random chance of failure
                if random.random() < 0.1: # 10% fail chance
                    self.safety_rating -= 5
                    machine.status = "BROKEN"
                    show_modal("QA FAILED!",
                               f"Physicist {physicist.name} reports a major error on {machine.name}! "
                               f"'{random.choice(['Laser alignment is 3mm off [cite: 5]', 'Output is 7% low [cite: 6]'])}!' "
                               f"The machine is DOWN for repairs. (-5% Safety)",
                               "ARRT Content: Evaluation of QA Results / Course of Action [cite: 7]")
                else:
                    self.score += 10
                    machine.status = "IDLE"
                    print(f"QA Passed on {machine.name}. (+10 Score)")
                    time.sleep(0.5)
            
            physicist.status = "IDLE"
            
        else: # Skip QA
            self.safety_rating -= 15
            for machine in machines_to_check:
                machine.status = "IDLE (UNCHECKED)"
            show_modal("QA SKIPPED!",
                       f"You have skipped mandatory QA. "
                       "All machines are operational, but this is a major safety violation. "
                       "Risk of error is high! (-15% Safety)",
                       "ARRT Content: Safety / Quality Control Procedures [cite: 4]")
    
    def scene_main_menu(self):
        """The main hub scene, acts as a router. Returns the next scene function."""
        self.update_hud()
        print("\n" + " DEPARTMENT OVERVIEW ".center(70, "-"))
        
        print("\nMachines:")
        for m in self.machine_list: print(f"  {m}")
        
        print("\nStaff:")
        for s in self.staff_list: print(f"  {s}")

        print("\n" + "-" * 70)

        choice = show_prompt("Main Menu",
                             "You are in the central department hub. Where do you want to go?",
                             ["Go to Office (Manage Patients/Staff)",
                              "Go to CT Simulator",
                              "Go to Linac 1",
                              "Go to Linac 2",
                              "End Day (Proceed to Day " + str(self.day + 1) + ")"])
        
        if choice == 0: return self.scene_office
        elif choice == 1: return self.scene_ct_sim
        elif choice == 2: return lambda: self.scene_linac("Linac 1") # Use lambda to pass args
        elif choice == 3: return lambda: self.scene_linac("Linac 2")
        elif choice == 4: return self.end_day
        
        return self.scene_main_menu # Default return

    def scene_office(self):
        """Handle patient queue and staff status. Returns the next scene function."""
        self.update_hud()
        print("\n" + " MANAGER'S OFFICE ".center(70, "-"))

        choice = show_prompt("Office",
                             "You are in your office.",
                             ["Review Patient Queue",
                              "Check Staff Roster & Dose Levels",
                              "Hire New Staff",
                              "Return to Main Hub"])

        if choice == 0:
            self.update_hud()
            print("\n" + " PATIENT QUEUE ".center(70, "-"))
            if not self.patient_queue:
                print("\nNo patients in the queue.")
            for p in self.patient_queue:
                print(f"  {p}")
            print("\n" + "-" * 70)
            input("\n[Press Enter to return to Office...]")
            return self.scene_office
        
        elif choice == 1:
            self.update_hud()
            print("\n" + " STAFF ROSTER ".center(70, "-"))
            for s in self.staff_list:
                print(f"  {s}")
            print("\n" + "-" * 70)
            input("\n[Press Enter to return to Office...]")
            return self.scene_office
        
        elif choice == 2:
            hire_choice = show_prompt("Hiring Portal",
                                      "Who do you want to hire?",
                                      ["Hire Therapist (Cost: $5000, Salary: $250/day)",
                                       "Hire Physicist (Cost: $10000, Salary: $400/day)",
                                       "Cancel"])
            if hire_choice == 0:
                self.modify_funds(-5000, "Hiring Fee - Therapist")
                new_therapist = Staff(f"Therapist {len(self.staff_list)+1}", "Therapist", 250)
                self.staff_list.append(new_therapist)
                show_modal("Staff Hired", f"{new_therapist.name} has joined the team.", "")
            elif hire_choice == 1:
                self.modify_funds(-10000, "Hiring Fee - Physicist")
                new_physicist = Staff(f"Physicist {len(self.staff_list)+1}", "Physicist", 400)
                self.staff_list.append(new_physicist)
                show_modal("Staff Hired", f"{new_physicist.name} has joined the team.", "")
            return self.scene_office

        elif choice == 3:
            return self.scene_main_menu

    def scene_ct_sim(self):
        """Handle simulation of new patients. Returns the next scene function."""
        self.update_hud()
        print("\n" + " CT SIMULATOR ROOM ".center(70, "-"))
        
        sim_machine = self.get_machine("CT Simulator")
        
        # Check machine status
        if sim_machine.status in ["BROKEN", "DOWN_FOR_QA"]:
            show_modal("Machine Unavailable",
                       f"The CT Simulator is currently {sim_machine.status.lower()}.",
                       "ARRT Content: Equipment Operation")
            return self.scene_main_menu
        
        # Find available staff (2 therapists)
        available_therapists = self.get_staff_by_role("Therapist", "IDLE")
        if len(available_therapists) < 2:
            show_modal("Staff Unavailable",
                       "You need at least 2 idle therapists to run a simulation.",
                       "ARRT Content: Procedures")
            return self.scene_main_menu

        # Find patients waiting for sim
        patients_to_sim = [p for p in self.patient_queue if p.status == "WAITING_FOR_SIM"]
        if not patients_to_sim:
            show_modal("CT Simulator", "There are no patients waiting for simulation.", "ARRT Content: Procedures [cite: 9]")
            return self.scene_main_menu

        # Show simulation prompt
        patient_options = [f"{p.name} ({p.diagnosis})" for p in patients_to_sim]
        patient_options.append("Return to Main Hub")
        
        choice = show_prompt("CT Simulator",
                             "The following patients are waiting for simulation.\nWho do you want to sim?",
                             patient_options)
        
        if choice == len(patient_options) - 1: # Last option is "Return"
            return self.scene_main_menu

        # --- Run Simulation ---
        patient = patients_to_sim[choice]
        therapists = available_therapists[:2]
        
        # Set resources to BUSY
        self.set_staff_status(therapists, "BUSY")
        sim_machine.status = "IN_USE"
        patient.status = "IN_SIMULATION"
        
        show_loading(f"Simulating {patient.name} with {therapists[0].name} and {therapists[1].name}", duration=3)
        
        # Add dose to staff
        for t in therapists: t.add_dose(0.05) # Small dose for sim [cite: 3]
        
        # Set resources back to IDLE
        self.set_staff_status(therapists, "IDLE")
        sim_machine.status = "IDLE"
        
        # --- Simplified Planning ---
        patient.status = "PLANNING"
        show_loading(f"Plan for {patient.name} is being calculated by Dosimetry", duration=2)
        patient.status = "WAITING_FOR_TX" # Ready for treatment
        
        self.score += 50
        self.modify_funds(1000, f"Simulation charge for {patient.name}")
        show_modal("Simulation Complete!",
                   f"{patient.name} has been simulated. The plan is complete and verified. "
                   f"The patient is now ready for their first treatment fraction. (+50 Score, +$1000)",
                   "ARRT Content: Treatment Volume Localization [cite: 9]")
        
        # Trigger event?
        self.trigger_random_event(therapists)
        
        return self.scene_main_menu

    def scene_linac(self, machine_name):
        """Handle treatment of a patient on a specific LINAC. Returns the next scene function."""
        self.update_hud()
        print("\n" + f" {machine_name.upper()} ROOM ".center(70, "-"))

        linac = self.get_machine(machine_name)

        # Check machine status
        if linac.status in ["BROKEN", "DOWN_FOR_QA"]:
            show_modal("Machine Unavailable", f"{linac.name} is currently {linac.status.lower()}.", "")
            return self.scene_main_menu
        
        # Check for skipped QA
        if linac.status == "IDLE (UNCHECKED)":
            if random.random() < 0.25: # 25% chance of disaster if QA skipped
                linac.status = "BROKEN"
                self.safety_rating -= 20
                show_modal("TREATMENT ERROR!",
                           "You tried to treat with a machine that had no morning QA! "
                           "A major error occurred (e.g., wrong dose, wrong field). "
                           "This is a major medical event! (-20% Safety)",
                           "ARRT Content: Safety / Medical Events [cite: 8]")
                return self.scene_main_menu
            else:
                print("WARNING: Treating on un-checked machine... you got lucky this time.")

        # Find available staff (2 therapists)
        available_therapists = self.get_staff_by_role("Therapist", "IDLE")
        if len(available_therapists) < 2:
            show_modal("Staff Unavailable", "You need at least 2 idle therapists to treat.", "")
            return self.scene_main_menu
            
        # Find patients waiting for treatment
        patients_to_treat = [p for p in self.patient_queue 
                             if p.status == "WAITING_FOR_TX" and not p.treated_today]
        if not patients_to_treat:
            show_modal(machine_name, "There are no patients waiting for treatment.", "")
            return self.scene_main_menu
            
        # Show treatment prompt, with URGENT patients listed first
        patients_to_treat.sort(key=lambda p: p.urgency == "URGENT", reverse=True)
        patient_options = []
        for p in patients_to_treat:
            urgency_flag = " [! URGENT !]" if p.urgency == "URGENT" else ""
            patient_options.append(f"{p.name} ({p.diagnosis} - Fx {p.fractions_done + 1}){urgency_flag}")
        
        patient_options.append("Return to Main Hub")
        
        choice = show_prompt(f"{machine_name} Console",
                             "The following patients are waiting for treatment.\nWho do you want to treat?",
                             patient_options)
        
        if choice == len(patient_options) - 1: # Last option is "Return"
            return self.scene_main_menu
            
        # --- Run Treatment ---
        patient = patients_to_treat[choice]
        therapists = available_therapists[:2]
        
        # Set resources to BUSY
        self.set_staff_status(therapists, "BUSY")
        linac.status = "IN_USE"
        patient.status = "IN_TREATMENT"
        
        show_loading(f"Treating {patient.name} (Fx {patient.fractions_done + 1}) with {therapists[0].name} and {therapists[1].name}", duration=3)
        
        # Add dose to staff (higher dose for treatment)
        for t in therapists: t.add_dose(0.25) # [cite: 3]
        
        # Set resources back to IDLE
        self.set_staff_status(therapists, "IDLE")
        linac.status = "IDLE"
        
        # Update patient
        patient.fractions_done += 1
        patient.treated_today = True
        
        if patient.fractions_done >= patient.total_fractions:
            patient.status = "TREATMENT_COMPLETE"
            self.score += 200 # Bonus for finishing
            self.modify_funds(15000, f"Course complete: {patient.name}")
            show_modal("Treatment Course Complete!",
                       f"{patient.name} has completed their final fraction! (+200 Score, +$15000)",
                       "ARRT Content: Procedures [cite: 11]")
            self.patient_queue.remove(patient)
        else:
            patient.status = "WAITING_FOR_TX" # Ready for next day
            self.modify_funds(500, f"Treatment fraction: {patient.name}")
            
        self.score += 25
        print(f"Treatment for {patient.name} complete. (+25 Score)")
        time.sleep(1)

        # Trigger event?
        self.trigger_random_event(therapists)

        return self.scene_main_menu

    def trigger_random_event(self, staff_involved):
        """A chance of a random event happening after an action."""
        if self.game_over: return
        
        if random.random() < 0.2: # 20% chance of an event
            event_type = random.choice(["PATIENT_CARE", "EMERGENCY", "ETHICAL", "COORDINATION"])
            
            if event_type == "PATIENT_CARE":
                # Low Blood Count event [cite: 2]
                show_modal("RANDOM EVENT: PATIENT CARE",
                           "A call from the lab: Patient Jane Doe's CBC results just came in. "
                           "Her platelet count is dangerously low!",
                           "ARRT Content: Patient Assessment / Blood Studies [cite: 2]")
                choice = show_prompt("Decision",
                                     "Dr. Evans says treating is high risk. What do you do?",
                                     ["Delay treatment for 1 day", "Treat anyway (RISKY)"])
                if choice == 1: # Treat anyway
                    self.safety_rating -= 15
                    show_modal("Decision: Treat Anyway",
                               "You treated the patient against the blood count warning. "
                               "This is a major safety risk! (-15% Safety)",
                               "ARRT Content: Patient Assessment [cite: 2]")
            
            elif event_type == "EMERGENCY":
                # Patient Seizure event [cite: 1]
                self.set_staff_status(staff_involved, "BUSY")
                show_modal("MEDICAL EMERGENCY!",
                           "A patient in the waiting room is having a seizure! "
                           f"{staff_involved[0].name} and {staff_involved[1].name} rush to help!",
                           "ARRT Content: Medical Emergencies [cite: 1]")
                show_loading("Staff are handling the emergency", duration=3)
                self.set_staff_status(staff_involved, "IDLE")
                show_modal("Emergency Resolved",
                           "The patient is stable and has been transferred to the ED. "
                           "Your staff handled it well, but it took time away from other tasks.",
                           "ARRT Content: Medical Emergencies [cite: 1]")
            
            elif event_type == "ETHICAL":
                # Living Will event [cite: 12]
                show_modal("RANDOM EVENT: ETHICAL DILEMMA",
                           f"You are walking by the waiting room when a patient stops you. "
                           f"'I have this living will,' they say, 'but I don't know if I filled it out right. Can you help me?'",
                           "ARRT Content: Patient Care - Ethical & Legal Aspects [cite: 12]")
                choice = show_prompt("Decision",
                                     "This is a complex legal document. What do you do?",
                                     ["Try your best to help them.", "Politely state you are not qualified and refer them to Social Services."])
                if choice == 0: # Try to help
                    self.safety_rating -= 5
                    show_modal("Decision: Help Patient",
                               "You gave the patient advice that was outside your scope of practice. "
                               "This is a legal and ethical risk! (-5% Safety)",
                               "ARRT Content: Ethical & Legal Aspects [cite: 12]")
                else: # Refer
                    self.score += 10
                    show_modal("Decision: Refer Patient",
                               "You correctly identified this was outside your scope and referred the patient to the proper expert. "
                               "Good choice! (+10 Score)",
                               "ARRT Content: Ethical & Legal Aspects")
            
            elif event_type == "COORDINATION":
                # Chemo coordination
                show_modal("RANDOM EVENT: SCHEDULING",
                           "The chemo infusion center calls. 'Patient John Smith's chemo appointment for tomorrow "
                           "has to be canceled. Should he still come in for radiation?'",
                           "ARRT Content: Multimodality Treatment [cite: 551]")
                choice = show_prompt("Decision",
                                     "The prescription is for concurrent chemoradiation. What do you do?",
                                     ["Treat him. Radiation is the priority.", "Call the Physician to confirm."])
                if choice == 0:
                    self.safety_rating -= 5
                    show_modal("Decision: Treat",
                               "You made a clinical decision without consulting the physician. "
                               "This could compromise the combined-modality treatment plan. (-5% Safety)",
                               "ARRT Content: Multimodality Treatment [cite: 551]")
                else:
                    self.score += 5
                    show_modal("Decision: Call Physician",
                               "Correct. You escalated the scheduling change to the physician, who will make the final clinical decision. (+5 Score)",
                               "ARRT Content: Multimodality Treatment")


    def end_day(self):
        """Cleans up the day and prepares for the next. Returns the next scene function."""
        clear_screen()
        print("\n" + f" END OF DAY {self.day} ".center(70, "-"))
        
        # --- 1. Pay Staff Salaries ---
        total_salary = sum(s.salary for s in self.staff_list if s.status != "ON_LEAVE")
        print(f"\nPaying daily salaries for {len([s for s in self.staff_list if s.status != 'ON_LEAVE'])} active staff...")
        self.modify_funds(-total_salary, "Staff Salaries")
        if self.game_over: return self.scene_main_menu # Bankrupt
        
        # --- 2. Check Staff Recovery ---
        for s in self.staff_list:
            s.end_of_day_recovery()
            
        # --- 3. Check for Untreated Urgent Patients ---
        print("\nChecking for untreated urgent patients...")
        untreated_urgent = [p for p in self.patient_queue
                            if p.urgency == "URGENT" 
                            and not p.treated_today 
                            and p.status != "TREATMENT_COMPLETE"]
        
        if untreated_urgent:
            self.safety_rating -= 10 * len(untreated_urgent)
            print(f"!! SAFETY VIOLATION: {len(untreated_urgent)} URGENT patient(s) were not treated today! (-{10 * len(untreated_urgent)}% Safety)")
        else:
            print("All urgent patients were treated. Good job.")
            
        # --- 4. Add New Patients ---
        if random.random() < 0.33: # 33% chance of a new patient
            new_pt_data = random.choice(PATIENT_TEMPLATES)
            new_pt = Patient(f"New Pt. ({new_pt_data['diag']})", new_pt_data['diag'], new_pt_data['dose'], new_pt_data['fx'], new_pt_data['urgency'])
            self.patient_queue.append(new_pt)
            print(f"\nNew Patient Arrived: {new_pt.name} is waiting for simulation.")
            
        # --- 5. Increment Day ---
        self.day += 1
        
        # Reset machine status for next day's QA
        for m in self.machine_list:
            if m.status != "BROKEN":
                m.status = "DOWN_FOR_QA"
        
        # Reset staff status
        for s in self.staff_list:
            if s.status != "ON_LEAVE":
                s.status = "IDLE"
        
        input("\n[Press Enter to start Day " + str(self.day) + "...]")
        
        self.start_day()
        return self.scene_main_menu


# --- Start the Game ---
if __name__ == "__main__":
    game = Game()
    game.setup_game()
    game.run()