/**
 * Interactive Cancer Center - Laboratory Logic
 * Handles embedded activities for Lobby, Nursing, and Physics.
 */

// ==========================================
// 1. PATIENT INTAKE (Lobby)
// ==========================================
window.intake = {
    state: { idVerified: false, siteVerified: false, consentSigned: false },
    
    // Initialize/Reset the activity
    init: () => { window.intake.reset(); },
    
    reset: () => {
        window.intake.state = { idVerified: false, siteVerified: false, consentSigned: false };
        document.getElementById('intake-feedback').classList.add('hidden');
        
        // Reset Visuals
        const consent = document.getElementById('emr-consent');
        consent.innerText = "UNSIGNED"; 
        consent.className = "text-red-600 font-bold";
        
        window.intake.renderOptions();
    },

    // Render the interactive buttons
    renderOptions: () => {
        const container = document.getElementById('intake-options');
        container.innerHTML = '';
        
        const actions = [
            { label: "Verify Name/DOB", check: "id" },
            { label: "Verify Site", check: "site" },
            { label: "Get Consent", check: "consent" },
            { label: "Proceed to Treat", check: "finish" }
        ];

        actions.forEach(act => {
            const btn = document.createElement('button');
            btn.className = "p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-left text-sm text-slate-200 transition flex items-center";
            
            // Icon Logic
            let icon = '⬜';
            if (window.intake.state.idVerified && act.check === 'id') icon = '✅';
            if (window.intake.state.siteVerified && act.check === 'site') icon = '✅';
            if (window.intake.state.consentSigned && act.check === 'consent') icon = '✍️';
            
            btn.innerHTML = `<span class="mr-3">${icon}</span> <span>${act.label}</span>`;
            btn.onclick = () => window.intake.handleAction(act);
            container.appendChild(btn);
        });
    },

    // Handle button clicks
    handleAction: (act) => {
        if (act.check === 'id') window.intake.state.idVerified = true;
        if (act.check === 'site') window.intake.state.siteVerified = true;
        
        if (act.check === 'consent') {
            window.intake.state.consentSigned = true;
            const el = document.getElementById('emr-consent');
            el.innerText = "SIGNED"; 
            el.className = "text-green-500 font-bold";
        }

        if (act.check === 'finish') {
            const s = window.intake.state;
            const success = s.idVerified && s.siteVerified && s.consentSigned;
            window.intake.showFeedback(success, 
                success ? "Patient Verified" : "Safety Violation", 
                success ? "All safety checks complete. Proceeding..." : "You missed critical checks (ID, Site, or Consent)."
            );
        } else {
            window.intake.renderOptions();
        }
    },

    showFeedback: (success, title, msg) => {
        const fb = document.getElementById('intake-feedback');
        document.getElementById('fb-title').innerText = title;
        document.getElementById('fb-title').className = success ? "text-2xl font-bold text-green-400" : "text-2xl font-bold text-red-400";
        document.getElementById('fb-msg').innerText = msg;
        fb.classList.remove('hidden');
    }
};

// ==========================================
// 2. NURSING STATION (Floor 2)
// ==========================================
window.nursing = {
    // Tab Switching
    tab: (id) => {
        ['vitals','labs','perf'].forEach(t => {
            document.getElementById('view-'+t).classList.add('hidden');
            document.getElementById('tab-'+t).classList.remove('bg-white','border','shadow-sm','font-bold','text-pink-600');
        });
        document.getElementById('view-'+id).classList.remove('hidden');
        document.getElementById('tab-'+id).classList.add('bg-white','border','shadow-sm','font-bold','text-pink-600');
    },

    // BP Needle Animation
    setPressure: (val) => {
        document.getElementById('needle').style.transform = `rotate(${-140 + (val * 1.12)}deg)`;
        document.getElementById('pressure-val').innerText = val;
    },

    playSound: () => { alert("🔊 Thump... Thump... (Simulated Audio)"); },

    // Lab Decision Logic
    decide: (c) => {
        const fb = document.getElementById('lab-feedback');
        if(c === 'hold'){
             fb.innerText = "Correct. Neutropenia (Low WBC) indicates infection risk.";
             fb.className = "mt-2 font-bold text-green-600";
        } else {
             fb.innerText = "Incorrect. Treating with Low WBC is dangerous.";
             fb.className = "mt-2 font-bold text-red-600";
        }
    },

    // ECOG Scoring Logic
    ecog: (v) => {
        const fb = document.getElementById('ecog-feedback');
        if(v === 2){
            fb.innerText = "Correct Assessment (Ambulatory > 50%).";
            fb.className = "mt-2 font-bold text-green-600";
        } else {
            fb.innerText = "Incorrect. Review ECOG definitions.";
            fb.className = "mt-2 font-bold text-red-600";
        }
    }
};

// ==========================================
// 3. PHYSICS & DOSIMETRY (Oncologic Emergencies)
// ==========================================

// Generated SVG Data URIs for X-Ray Simulation (No external files needed)
const GFX = {
    // A simple spine graphic (Black background, white bones)
    spineRef: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiB2aWV3Qm94PSIwIDAgNTAwIDUwMCI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMzMzMiLz48cGF0aCBkPSJNMjQwLDUwIEwyNDAsNDUwIEwyNjAsNDUwIEwyNjAsNTAgWiIgZmlsbD0iIzExMSIvPjxyZWN0IHg9IjIyMCIgeT0iMTUwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuNSIvPjx0ZXh0IHg9IjI1MCIgeT0iMjUwIiBmaWxsPSIjNzc3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TUElORSBSRUY8L3RleHQ+PC9zdmc+",
    spineMov: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiB2aWV3Qm94PSIwIDAgNTAwIDUwMCI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9InRyYW5zcGFyZW50Ii8+PHBhdGggZD0iTTI0MCw1MCBMMjQwLDQ1MCBMMjYwLDQ1MCBMMjYwLDUwIFoiIGZpbGw9IiM1NTUiLz48cmVjdCB4PSIyMjAiIHk9IjE1MCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMjIyIiBvcGFjaXR5PSIwLjUiLz48dGV4dCB4PSIyNTAiIHk9IjI1MCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UE9SVEFMPC90ZXh0Pjwvc3ZnPg==",
    // A simple brain/skull graphic
    brainRef: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiB2aWV3Qm94PSIwIDAgNTAwIDUwMCI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMzMzMiLz48Y2lyY2xlIGN4PSIyNTAiIGN5PSIyNTAiIHI9IjEyMCIgZmlsbD0iIzIyMiIvPjxjaXJjbGUgY3g9IjI4MCIgY3k9IjIzMCIgcj0iMjAiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuNiIvPjwvc3ZnPg==",
    brainMov: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiB2aWV3Qm94PSIwIDAgNTAwIDUwMCI+PGNpcmNsZSBjeD0iMjUwIiBjeT0iMjUwIiByPSIxMjAiIGZpbGw9IiM1NTUiLz48Y2lyY2xlIGN4PSIyODAiIGN5PSIyMzAiIHI9IjIwIiBmaWxsPSIjMjIyIiBvcGFjaXR5PSIwLjYiLz48L3N2Zz4="
};

window.physics = {
    cases: {
        'spine': { ref: GFX.spineRef, mov: GFX.spineMov, desc: "T-Spine: Align vertebral bodies.", xTarget: 0, yTarget: 0 },
        'brain': { ref: GFX.brainRef, mov: GFX.brainMov, desc: "Whole Brain: Align skull & orbits.", xTarget: 0, yTarget: 0 }
    },
    currentCase: 'spine',
    pos: { x: 0, y: 0 },
    isDragging: false,
    dragStart: { x:0, y:0 },

    init: () => {
        window.physics.loadCase('spine');
        window.physics.setupDrag();
    },

    tab: (id) => {
        document.getElementById('view-sim').classList.toggle('hidden', id !== 'sim');
        document.getElementById('view-ref').classList.toggle('hidden', id !== 'ref');
        
        const btnSim = document.getElementById('tab-sim');
        const btnRef = document.getElementById('tab-ref');
        
        // Toggle Active Styles
        if(id === 'sim') {
            btnSim.className = "text-left px-4 py-3 rounded-lg bg-blue-900/20 border border-blue-500/50 text-blue-300 font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)]";
            btnRef.className = "text-left px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-400 transition";
        } else {
            btnRef.className = "text-left px-4 py-3 rounded-lg bg-blue-900/20 border border-blue-500/50 text-blue-300 font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)]";
            btnSim.className = "text-left px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-400 transition";
        }
    },

    loadCase: (c) => {
        window.physics.currentCase = c;
        const data = window.physics.cases[c];
        
        document.getElementById('img-ref').src = data.ref;
        document.getElementById('img-overlay').src = data.mov;
        document.getElementById('sim-info').textContent = data.desc;
        
        // Randomize start position for difficulty
        window.physics.pos = { 
            x: (Math.random() * 60) - 30, 
            y: (Math.random() * 60) - 30 
        };
        window.physics.updatePos();
        
        document.getElementById('sim-feedback').className = "absolute top-4 left-1/2 -translate-x-1/2 z-20 px-6 py-2 rounded-full bg-slate-800 border border-slate-600 text-sm font-mono hidden";
    },

    setOpacity: (val) => {
        document.getElementById('img-overlay-wrap').style.opacity = val / 100;
    },

    setupDrag: () => {
        const el = document.getElementById('img-overlay-wrap');
        
        // Mouse/Touch Down
        el.onmousedown = (e) => {
            window.physics.isDragging = true;
            window.physics.dragStart = { x: e.clientX - window.physics.pos.x, y: e.clientY - window.physics.pos.y };
            el.style.cursor = 'grabbing';
        };
        
        // Global Up
        window.onmouseup = () => {
            window.physics.isDragging = false;
            el.style.cursor = 'move';
        };

        // Global Move
        window.onmousemove = (e) => {
            if(!window.physics.isDragging) return;
            window.physics.pos.x = e.clientX - window.physics.dragStart.x;
            window.physics.pos.y = e.clientY - window.physics.dragStart.y;
            window.physics.updatePos();
        };

        // Keyboard Controls (Arrow Keys)
        document.addEventListener('keydown', (e) => {
            // Only capture if physics panel is visible
            const panel = document.getElementById('panel-physics');
            if(!panel || getComputedStyle(panel).display === 'none') return;
            
            const step = e.shiftKey ? 10 : 1;
            let handled = false;
            if(e.key === 'ArrowUp') { window.physics.pos.y -= step; handled = true; }
            if(e.key === 'ArrowDown') { window.physics.pos.y += step; handled = true; }
            if(e.key === 'ArrowLeft') { window.physics.pos.x -= step; handled = true; }
            if(e.key === 'ArrowRight') { window.physics.pos.x += step; handled = true; }
            
            if(handled) {
                e.preventDefault();
                window.physics.updatePos();
            }
        });
    },

    updatePos: () => {
        const el = document.getElementById('img-overlay-wrap');
        el.style.left = `calc(50% + ${window.physics.pos.x}px)`;
        el.style.top = `calc(50% + ${window.physics.pos.y}px)`;
    },

    verify: () => {
        const threshold = 5; // pixels tolerance
        const dist = Math.sqrt(window.physics.pos.x**2 + window.physics.pos.y**2);
        const fb = document.getElementById('sim-feedback');
        
        fb.classList.remove('hidden');
        if(dist < threshold) {
            fb.innerHTML = `<i class="fas fa-check-circle text-green-400 mr-2"></i> EXCELLENT. Alignment < 2mm.`;
            fb.className = "absolute top-4 left-1/2 -translate-x-1/2 z-20 px-6 py-2 rounded-full bg-green-900/90 border border-green-500 text-green-100 text-sm font-bold shadow-lg shadow-green-900/50";
        } else {
            fb.innerHTML = `<i class="fas fa-times-circle text-red-400 mr-2"></i> OFF TARGET. Deviation: ${Math.round(dist)}mm`;
            fb.className = "absolute top-4 left-1/2 -translate-x-1/2 z-20 px-6 py-2 rounded-full bg-red-900/90 border border-red-500 text-red-100 text-sm font-bold shadow-lg shadow-red-900/50";
        }
    }
};

// ==========================================
// 4. GLOBAL PANEL MANAGER
// ==========================================
window.Panels = {
    close: () => {
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    },
    open: (id) => {
        // Close others first
        window.Panels.close();
        const p = document.getElementById('panel-' + id);
        if(p) p.classList.add('active');
    }
};
