# Folding New Components into the Radiation Center

The Center is built to grow. There are **three tiers** at which you can add things,
from "two minutes" to "a bit of 3D work."

---

## Tier 1 — Add a learning file (≈ 1 line)  ← most common

Any self-contained HTML page (a quiz, a Three.js mini-app, a slide deck exported to
HTML, even a PDF) becomes a **Learning Station** inside a room.

1. Drop the file in this folder (or a subfolder, e.g. `Treatment_Planning/`).
2. Open `app.js`, find the **COMPONENT REGISTRY** block near the top of the
   stations section, and add one entry under the room you want:

```js
phys: [
  // ...existing entries...
  { name:'DVH Explorer', sub:'Dose-volume histogram practice', icon:'📈',
    group:'Treatment Planning', kind:'activity', src:'Treatment_Planning/dvh_explorer.html' },
],
```

Field reference:

| field   | meaning |
|---------|---------|
| `name`  | button + overlay title |
| `sub`   | one-line description |
| `icon`  | any emoji/char |
| `group` | optional sub-heading the button is filed under (e.g. "Treatment Planning") |
| `kind`  | `'activity'` embed an HTML file · `'native'` built-in module · `'link'` open in a new tab |
| `src`   | file path or URL (for `activity` / `link`) |
| `module`| native renderer key (for `native`), e.g. `'vitals'` |

That's it. The button appears in that room's panel, opens in the overlay, and gets an
**Open in new tab ↗** button automatically (so it still works if a browser blocks embedding).

Rooms are keyed by id: `lobby`, `exam`, `ct`, `phys`, `vault`.

---

## Tier 2 — Add a built-in (native) module

For interactivity you want *inside* the Center's own UI (like the Vital Signs Trainer),
write a render function and register it:

```js
const NATIVE = {
  vitals: (host) => renderVitals(host),
  mlcShaper: (host) => renderMLC(host),     // <- your new module
};
```

Then reference it from the registry:

```js
{ name:'MLC Shaper', sub:'Shape an aperture to the target', icon:'▦',
  kind:'native', module:'mlcShaper' }
```

Your `render<X>(host)` function just fills the passed-in `host` element with HTML and
wires up its own listeners. `renderVitals()` is a complete worked example.

---

## Tier 3 — Add a room or a machine (3D)

* **New room:** add one object to the `ROOMS` array (id, name, position `x/z`,
  size `w/d`, color, camera framing, description). A floor, walls with a doorway,
  a floating label and a room card are generated for you. Then write a small
  `buildYourRoom()` that places furniture/equipment, and call it from `init()`.

* **New machine/prop in an existing room:** write a builder that creates a
  `THREE.Group`, parks moving parts in `RIG.<name>`, and (if it should move) add a
  few lines to `stepMachines()` plus controls to that room's `PANELS` entry. The
  CT scanner, LINAC and water phantom are all built this way and make good templates.

---

## Where things live in `app.js`

```
MATERIALS / helpers ......... shared look & geometry
ROOMS array ................. room layout (Tier 3)
buildBuilding / walls ....... floors, doorways, labels
buildLobby/Exam/CT/Physics/Linac ... per-room equipment (Tier 3)
PANELS ...................... right-hand control UI per room
COMPONENT REGISTRY (STATIONS) ... learning files (Tier 1)  ← edit here
NATIVE ...................... built-in modules (Tier 2)
renderVitals ................ example native module
stepMachines ................ per-frame kinematics
```
