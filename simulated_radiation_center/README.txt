SIMULATED RADIATION CENTER — with Learning Stations
====================================================

WHAT'S HERE
  index.html ....................... the Center (loads app.js)
  app.js ........................... all 3D + UI + Vital Signs trainer logic
  simulated_radiation_center.html .. a single-file build of the same Center
  patient_journey_sequencer_activity.html
  patient_care_skills_activity.html
  patient_safety_id_lab.html
  mitosis_microscopev2.html ........ the four embedded learning activities

HOW TO RUN (recommended)
  Browsers block embedded pages (iframes) and some assets on file://, so run a
  tiny local server from THIS folder:

      python -m http.server 8000

  Then open:  http://localhost:8000/        (uses index.html + app.js)
          or  http://localhost:8000/simulated_radiation_center.html

LEARNING STATIONS (where each activity lives)
  Lobby   -> Patient Journey Sequencer
  Exam    -> Vital Signs Trainer (built in) + Patient Care Skills + Patient Safety & ID
  CT      -> Patient Safety & ID
  Physics -> Cell Division Microscope
  Vault   -> Patient Safety & ID
  Open a room, then click a "Learning Stations" button. Esc or click the
  backdrop to close.

NOTE
  The Vital Signs Trainer is native to the Center and works even without a
  server. The other four open in an overlay iframe; if a frame is blank you're
  on file:// — start the local server above.
