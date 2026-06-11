/* ===================================================================
   RTApps Station Bridge  ·  rtapps-bridge.js
   Drop this into any e-Workbook tool to report scores to the OncoLife
   Program Office (or the Simulated Center) when the tool runs inside it.

   Add ONE script tag:
     <script src="rtapps-bridge.js"></script>

   Then EITHER call this at your scoring point:
     RTApps.complete(scorePct, { kesn:{K,E,S,N}, archetype:'Robot'|'Theorist'|'Balanced', raw:{...} });

   OR, for a tool that already shows a "Final Score: 86%" on completion,
   add one line on load and it auto-captures:
     RTApps.watchScore({ label:'Final Score' });

   The bridge posts an ASSESSMENT_RESULTS payload to the parent window:
     { type:'RTAPPS_RESULT', payload:{ ...result_id, slo_id, student_id,
       final_score, scorePct, kesn, archetype, raw_data_payload } }
   It is a no-op when the tool is opened standalone (no parent listener).
   =================================================================== */
(function () {
  'use strict';
  // launch context arrives from the host (Office/Center) via postMessage,
  // or via a URL hash (#rtapps=<encoded JSON>) as a fallback.
  function ctx() {
    if (window.__RTAPPS_CTX__) return window.__RTAPPS_CTX__;
    try { var h = location.hash.match(/rtapps=([^&]+)/); if (h) return JSON.parse(decodeURIComponent(h[1])); } catch (e) { }
    return {};
  }
  window.addEventListener('message', function (e) {
    if (e && e.data && e.data.type === 'RTAPPS_CTX') window.__RTAPPS_CTX__ = e.data.ctx || {};
  });

  function complete(scorePct, raw) {
    raw = raw || {};
    var pct = Math.max(0, Math.min(100, Number(scorePct) || 0));
    var c = ctx();
    var payload = {
      result_id: 'r' + Date.now() + Math.floor(Math.random() * 1e4),
      timestamp: new Date().toISOString(),
      program_id: c.program || '',
      slo_id: c.slo || '',
      goal_id: c.goal || '',
      student_id: c.student || '',
      cohort: c.cohort || '',
      period: c.period || '',
      tool_type: raw.tool_type || 'eWorkbook',
      final_score: (pct / 100).toFixed(2),
      scorePct: Math.round(pct),
      pass_fail: null,
      attempts_count: raw.attempts_count || 1,
      kesn: raw.kesn || null,
      archetype: raw.archetype || null,
      raw_data_payload: raw.raw || raw.raw_data_payload || null
    };
    try { window.parent && window.parent.postMessage({ type: 'RTAPPS_RESULT', payload: payload }, '*'); } catch (e) { }
    return payload;
  }

  // Auto-capture: watch the DOM for a completion element containing `label`,
  // parse a percentage out of it, and report once.
  function watchScore(opts) {
    opts = opts || {};
    var label = opts.label || 'Final Score';
    var parse = opts.parse || function (txt) { var m = String(txt).match(/(\d+(?:\.\d+)?)\s*%/); return m ? parseFloat(m[1]) : null; };
    var done = false;
    function scan() {
      if (done) return;
      var nodes = document.querySelectorAll(opts.selector || 'body *'), i, t, pct;
      for (i = 0; i < nodes.length; i++) {
        t = nodes[i].textContent || '';
        if (opts.selector || t.indexOf(label) >= 0) {
          pct = parse(t);
          if (pct != null && !isNaN(pct) && nodes[i].offsetParent !== null) { done = true; obs.disconnect(); complete(pct, opts); return; }
        }
      }
    }
    var obs = new MutationObserver(scan);
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    scan();
    return obs;
  }

  window.RTApps = { complete: complete, watchScore: watchScore, context: ctx, version: '1.0' };
})();
