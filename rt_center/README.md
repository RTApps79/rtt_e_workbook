# Simulated Radiation Center — integrated build

The Simulated Center (`simulated_radiation_center.html`) is now the shell.
The other three apps are wired into it as room stations and talk to each
other and to the shell over a tiny `RTBus` message bus (plain
`postMessage`, no backend) so information flows through the workflow
instead of every simulator starting from its own demo patient.

## Run it

Because two rooms embed the other files as `<iframe>`s, open this folder
through a local static server rather than double-clicking the HTML file
(browsers block cross-file iframes and `fetch()` on `file://`):

```
python -m http.server 8000
```

then open `http://localhost:8000/simulated_radiation_center.html`.
(Opened straight off disk it still runs — every station also has an
"Open in new tab ↗" fallback — you just won't get the embedded iframes or
the real-DICOM auto-fetch.)

## What's wired together

**Lobby**
- Patient Journey Sequencer (unchanged)
- **RT Workflow Suite** — the 30-patient realistic-chart roster is now a
  lobby station. Selecting a patient there and approving their plan/QA
  reports back to the shell over `RTBus`; its "Open full LINAC console"
  link now points at the shared `linac-console.html`.

**Exam → CT Simulation**
- Scan borders & protocol grading is unchanged, but approving it no
  longer instantly marks the patient simulated. It now unlocks a new
  **"Acquire CT / DICOM set"** step that opens `dicom-alignment-lab.html`
  pre-loaded with a phantom shaped for the patient's anatomic region
  (Brain, Head & Neck, Thorax, Breast, Pelvis, Abdomen, Skeletal,
  Lymphoma, Skin/TSEBT, Heme/TBI — same taxonomy the workflow suite and
  CT-sim protocol grader already use). Approving that acquisition is what
  finally marks simulation complete and unlocks Physics.

**Physics / Dosimetry** — unchanged (plan + QA gate treatment as before).

**LINAC Vault**
- The Treatment Console station now embeds the full standalone
  `linac-console.html` (pendant, BEV, MLC, interlocks, procedural CBCT)
  instead of the simplified built-in console. On open, the shell pushes
  the active patient's name/MRN/Rx/fraction count into it over `RTBus`
  (`center:init`) so it isn't stuck on the demo "Chen, Sarah" patient.
- Inside the console, **"Open DICOM alignment lab ↗"** launches
  `dicom-alignment-lab.html` in a real MPR registration mode. The mode is
  chosen automatically per the Rx technique: **CBCT** for VMAT/IMRT/
  SBRT/SRS/proton plans, **kV pair vs. topogram** for simpler 2D/3D-CRT
  setups — matching how those are actually image-guided in the clinic.
  The approved shift posts back and fills the console's Vrt/Lng/Lat
  readout; delivering a full fraction reports back to the shell and
  advances the patient's fraction count.

## Anatomic-region DICOM sets

`dicom/<region-slug>/` folders (already created next to these files, one
per region — `brain`, `head-neck`, `thorax`, `breast`, `pelvis`,
`abdomen`, `skeletal`, `lymphoma`, `skin`, `heme-tbi`, `other`) are where
you can drop your own de-identified planning-CT DICOM series later.

- Drop the slice files in, e.g., `dicom/thorax/`, and add a
  `manifest.json` there listing the filenames:
  ```json
  ["CT.1.dcm", "CT.2.dcm", "CT.3.dcm", "..."]
  ```
- `dicom-alignment-lab.html` tries that manifest first and loads the real
  series through the existing `dicom-parser`-based loader (uncompressed
  transfer syntaxes; same loader the file already had for drag-and-drop).
- If no manifest is found (nothing dropped in yet, or opened straight off
  disk without a server), it automatically falls back to a synthetic
  phantom shaped for that region, so the whole Sim → DICOM → Plan → QA →
  IGRT → Treat pipeline is fully usable today and upgrades the moment you
  supply real series — no code changes needed.
- `cine` paths are reserved in the shell's `DICOM_REGISTRY` for a
  per-region localizer/4D-CT cine clip if you want to add one later; not
  required for the workflow to function.

## Onboarding: mentor bubbles & tooltips

The shell (`simulated_radiation_center.html`) now has a lightweight, purely
explanatory guidance layer — nothing here gates or changes the workflow:

- **Mentor bubbles** — a small "Dana · Chief Therapist" speech bubble
  (bottom-left) explains what a room or station is for, the first time you
  enter/open it. Seen-state is remembered per browser (`localStorage`), so
  it won't repeat.
- **Tooltips** — plain hover labels on quick UI controls (Overview/Walk
  toggle, room cards, patient-card buttons, the beam status pill).
- **Help button** — the floating **?** (bottom-right) replays the mentor
  bubble for whatever room/station is currently on screen, any time,
  regardless of whether you've already seen it.

To add a mentor moment for a new room or station, add an entry to
`ROOM_GUIDE` / `STATION_GUIDE` in `simulated_radiation_center.html` (or
call `RTGuide.mentor(key, title, text)` directly); to add a tooltip, add a
`data-tip="..."` attribute to the element (use `data-tip-wide` too if the
text should wrap instead of staying on one line).

## Files

| File | Role |
|---|---|
| `simulated_radiation_center.html` | 3D shell — rooms, patient chart, workflow gating, RTBus hub |
| `linac-console.html` | Full LINAC treatment console (embedded in the Vault + standalone) |
| `dicom-alignment-lab.html` | DICOM MPR viewer / CT-sim acquisition / IGRT registration (embedded + standalone) |
| `rt-workflow-suite.html` | 30-patient realistic roster, Sim→Plan→QA→Treat (lobby station + standalone) |
| `dicom/<region>/` | Drop real de-identified planning-CT series here per anatomic region |
