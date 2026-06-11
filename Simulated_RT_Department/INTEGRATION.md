# Wiring an e-Workbook tool to the OncoLife Program Office

The Office (and, later, the Simulated Center) launches a tool in a frame and
listens for one message. To make any tool report into the dashboard, add the
**RTApps Station Bridge** and one line. No rewrite of your tool is required.

## 1. Add the bridge

Copy `rtapps-bridge.js` into the tool's folder and add, before your own script:

```html
<script src="rtapps-bridge.js"></script>
```

## 2. Report the score (pick one)

**A. Explicit (best) — call it where you already compute the final score.**
Your PDF tools already build a `payload`/`finalScore`; add one line right there:

```js
// finalScore is 0..1, or use a 0..100 percentage directly
RTApps.complete(finalScore * 100, {
  kesn: { K: 86, E: 78, S: 40, N: 70 },   // optional OncoLife attributes
  archetype: 'Balanced',                  // optional: Robot | Theorist | Balanced
  raw: payload                            // optional raw capture for review
});
```

**B. Zero-touch — auto-capture from the completion screen.**
For a tool that shows e.g. `Final Score: 86%` when finished (the Legal Doctrines
Assessment does), add one line on load and the bridge reads it for you:

```js
RTApps.watchScore({ label: 'Final Score' });   // parses the % near that label
// or target an element:  RTApps.watchScore({ selector: '#finalScore' });
```

## Tool-specific notes

- **Ethics / Legal Doctrines Assessment** — ends on a "Final Score" /
  "Performance Level" summary. Easiest path: `RTApps.watchScore({ label:'Final Score' })`.
- **4D CT Simulator** — call `RTApps.complete()` when the **X-ray Knowledge Quiz**
  is submitted (`Submit Quiz`) and/or when a guided **Exercise** is marked complete
  (the "OK" on a passed exercise). You can report each separately or combine.

## What the host receives

```js
{ type: 'RTAPPS_RESULT', payload: {
    result_id, timestamp, program_id, slo_id, goal_id, student_id, cohort, period,
    tool_type, final_score /* "0.86" */, scorePct /* 86 */, pass_fail,
    attempts_count, kesn, archetype, raw_data_payload } }
```

The Office maps `scorePct` to the 4-Point Clinical Mastery Scale, marks the SLO's
benchmark met/not, updates the cohort K·E·S·N profile, and refreshes the dashboard.

The bridge is a no-op when the tool is opened on its own (no parent), so wiring a
tool never breaks its standalone use. Educational platform — not for clinical use.
