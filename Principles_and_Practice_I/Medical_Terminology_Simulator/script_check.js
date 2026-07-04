
(function(){
  'use strict';

  const STORAGE_KEY = 'rtappsTerminologyBuilder.v2';
  const levelLabels = {
    cell: { icon:'🧬', title:'Cell', desc:'word parts and microscopic processes' },
    tissue: { icon:'🧫', title:'Tissue', desc:'histology and pathology language' },
    organ: { icon:'🫀', title:'Organ', desc:'site-specific and anatomy terms' },
    human: { icon:'🧍', title:'Human', desc:'whole-patient care and workflow terms' }
  };

  const data = {
    general: {
      label:'General medical terminology',
      cell: [
        {term:'hypertension', parts:['hyper','tension'], meaning:'abnormally high blood pressure', clue:'above normal + pressure', category:'vital sign'},
        {term:'tachycardia', parts:['tachy','cardia'], meaning:'abnormally fast heart rate', clue:'fast + heart', category:'cardiovascular'},
        {term:'hypoglycemia', parts:['hypo','glyc','emia'], meaning:'low blood sugar', clue:'below normal + sugar + blood condition', category:'laboratory'},
        {term:'neuralgia', parts:['neur','algia'], meaning:'nerve pain', clue:'nerve + pain', category:'symptom'}
      ],
      tissue: [
        {term:'edema', parts:['edema'], meaning:'swelling caused by fluid accumulation', clue:'fluid swelling', category:'tissue response'},
        {term:'anemia', parts:['an','emia'], meaning:'condition of low or deficient blood components', clue:'without + blood condition', category:'laboratory'},
        {term:'necrosis', parts:['necr','osis'], meaning:'death of tissue', clue:'death + condition', category:'pathology'},
        {term:'fibrosis', parts:['fibr','osis'], meaning:'formation of fibrous or scar-like tissue', clue:'fiber + condition', category:'tissue change'}
      ],
      organ: [
        {term:'hepatomegaly', parts:['hepato','megaly'], meaning:'enlargement of the liver', clue:'liver + enlargement', category:'organ change'},
        {term:'cardiomegaly', parts:['cardio','megaly'], meaning:'enlargement of the heart', clue:'heart + enlargement', category:'organ change'},
        {term:'pulmonary', parts:['pulmon','ary'], meaning:'pertaining to the lungs', clue:'lung + pertaining to', category:'anatomy'},
        {term:'gastritis', parts:['gastr','itis'], meaning:'inflammation of the stomach', clue:'stomach + inflammation', category:'inflammation'}
      ],
      human: [
        {term:'biopsy', parts:['bi','opsy'], meaning:'examination of living tissue', clue:'life + viewing', category:'procedure'},
        {term:'endoscopy', parts:['endo','scopy'], meaning:'visual examination from within', clue:'within + viewing', category:'procedure'},
        {term:'radiograph', parts:['radio','graph'], meaning:'recorded image made with radiation', clue:'radiation + recording', category:'imaging'},
        {term:'prognosis', parts:['pro','gnosis'], meaning:'predicted outcome of a condition', clue:'before + knowledge', category:'clinical reasoning'}
      ]
    },
    oncology: {
      label:'Oncology terminology',
      cell: [
        {term:'neoplasm', parts:['neo','plasm'], meaning:'new growth; may be benign or malignant', clue:'new + growth', category:'tumor language'},
        {term:'dysplasia', parts:['dys','plasia'], meaning:'abnormal development or growth', clue:'bad/abnormal + formation', category:'cellular change'},
        {term:'mitosis', parts:['mit','osis'], meaning:'cell division', clue:'division + process', category:'cell process'},
        {term:'carcinoma', parts:['carcin','oma'], meaning:'malignant tumor of epithelial origin', clue:'cancer + tumor', category:'cancer type'}
      ],
      tissue: [
        {term:'histology', parts:['hist','ology'], meaning:'study of tissues', clue:'tissue + study of', category:'diagnostic science'},
        {term:'pathology', parts:['path','ology'], meaning:'study of disease', clue:'disease + study of', category:'diagnostic science'},
        {term:'metastasis', parts:['meta','stasis'], meaning:'spread of disease from one site to another', clue:'change/beyond + standing', category:'disease progression'},
        {term:'necrotic', parts:['necr','otic'], meaning:'relating to tissue death', clue:'death + pertaining to', category:'tissue change'}
      ],
      organ: [
        {term:'hepatocellular', parts:['hepato','cellular'], meaning:'relating to liver cells', clue:'liver + cells', category:'organ/cell descriptor'},
        {term:'pulmonary', parts:['pulmon','ary'], meaning:'relating to the lungs', clue:'lung + pertaining to', category:'anatomy'},
        {term:'oncologic', parts:['onc','ologic'], meaning:'relating to tumors or cancer care', clue:'tumor + pertaining to study', category:'oncology care'},
        {term:'lymphadenopathy', parts:['lymph','adeno','pathy'], meaning:'disease or abnormality of lymph nodes', clue:'lymph + gland + disease', category:'nodal disease'}
      ],
      human: [
        {term:'staging', parts:['stag','ing'], meaning:'classification of extent of disease', clue:'placing disease into stage', category:'disease classification'},
        {term:'remission', parts:['re','mission'], meaning:'reduction or disappearance of disease signs', clue:'send back/reduction', category:'disease status'},
        {term:'palliative', parts:['pall','iative'], meaning:'relieving symptoms without necessarily curing disease', clue:'relief-focused care', category:'treatment goal'},
        {term:'metastatic', parts:['meta','static'], meaning:'describing disease that has spread to distant sites', clue:'beyond + relating to spread', category:'disease progression'}
      ]
    },
    rt: {
      label:'Radiation therapy terminology',
      cell: [
        {term:'radiobiology', parts:['radio','bio','logy'], meaning:'study of radiation effects on living systems', clue:'radiation + life + study', category:'science'},
        {term:'fraction', parts:['fract','ion'], meaning:'one divided portion of the total treatment dose', clue:'break/divide + noun', category:'dose delivery'},
        {term:'dosimetry', parts:['dosi','metry'], meaning:'measurement or calculation of absorbed dose', clue:'dose + measurement', category:'physics'},
        {term:'isocenter', parts:['iso','center'], meaning:'fixed central reference point used for treatment geometry', clue:'equal + center', category:'geometry'}
      ],
      tissue: [
        {term:'toxicity', parts:['toxic','ity'], meaning:'harmful treatment-related effect on tissue or organ function', clue:'poison/harm + condition', category:'side effect'},
        {term:'fibrosis', parts:['fibr','osis'], meaning:'scar-like tissue change after injury or treatment', clue:'fiber + condition', category:'late effect'},
        {term:'mucositis', parts:['muco','itis'], meaning:'inflammation of mucous membranes', clue:'mucus/mucosa + inflammation', category:'side effect'},
        {term:'dermatitis', parts:['dermat','itis'], meaning:'inflammation of the skin', clue:'skin + inflammation', category:'side effect'}
      ],
      organ: [
        {term:'simulation', parts:['simul','ation'], meaning:'process used to establish a reproducible treatment setup', clue:'make similar + process', category:'workflow'},
        {term:'immobilization', parts:['im','mobil','ization'], meaning:'process of limiting patient movement for reproducibility', clue:'not + move + process', category:'setup'},
        {term:'fractionation', parts:['fract','ion','ation'], meaning:'dividing a total treatment dose into multiple sessions', clue:'break/divide + noun + process', category:'dose delivery'},
        {term:'dosimetric', parts:['dosi','metric'], meaning:'relating to dose measurement or calculation', clue:'dose + measuring', category:'physics'}
      ],
      human: [
        {term:'planning', parts:['plan','ning'], meaning:'designing the treatment approach before delivery', clue:'map out the treatment', category:'workflow'},
        {term:'verification', parts:['ver','i','fi','cation'], meaning:'checking setup or parameters for correctness', clue:'make true/correct + process', category:'safety'},
        {term:'workflow', parts:['work','flow'], meaning:'sequence of clinical tasks', clue:'process path', category:'operations'},
        {term:'treatment', parts:['treat','ment'], meaning:'therapy given to manage disease', clue:'care process', category:'therapy'}
      ]
    }
  };

  const scenarioBank = {
    general: [
      {text:'A patient has abnormally high blood pressure documented before a procedure.', answer:'hypertension', reason:'Hyper- means excessive or above normal, and tension refers to pressure.'},
      {text:'A patient describes sharp nerve pain after surgery.', answer:'neuralgia', reason:'Neur/o refers to nerve, and -algia means pain.'},
      {text:'A lab result suggests too little glucose in the blood.', answer:'hypoglycemia', reason:'Hypo- means low, glyc/o refers to sugar, and -emia means blood condition.'},
      {text:'The report describes inflammation of the stomach.', answer:'gastritis', reason:'Gastr/o means stomach, and -itis means inflammation.'}
    ],
    oncology: [
      {text:'A pathology report describes a malignant epithelial tumor.', answer:'carcinoma', reason:'Carcin/o refers to cancer, and -oma refers to tumor or mass.'},
      {text:'The disease has spread from the primary site to distant bone.', answer:'metastasis', reason:'Metastasis describes spread from one site to another.'},
      {text:'The care team classifies the disease extent as stage III.', answer:'staging', reason:'Staging classifies the extent or spread of cancer.'},
      {text:'The goal of treatment is symptom relief rather than cure.', answer:'palliative', reason:'Palliative care focuses on relief of symptoms and quality of life.'}
    ],
    rt: [
      {text:'The treatment course is divided into many small daily doses.', answer:'fractionation', reason:'Fractionation divides total dose into multiple treatment sessions.'},
      {text:'The patient is positioned and marked to make future treatment setup reproducible.', answer:'simulation', reason:'Simulation establishes the reproducible treatment setup.'},
      {text:'The therapist checks the setup before treatment delivery.', answer:'verification', reason:'Verification means checking that setup or treatment parameters are correct.'},
      {text:'A mask is used to limit motion and improve reproducibility.', answer:'immobilization', reason:'Immobilization limits movement during setup and treatment.'}
    ]
  };

  const $ = (id)=>document.getElementById(id);
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const sections = {
    explorer: $('explorerSection'),
    assembly: $('assemblySection'),
    scenario: $('scenarioSection'),
    match: $('matchSection'),
    flashcards: $('flashcardsSection'),
    quiz: $('quizSection')
  };

  let state = {
    activeTab:'explorer', track:'general', level:'cell', difficulty:1,
    xp:0, correct:0, attempts:0, streak:0, bestStreak:0,
    selectedTermIndex:0, assembly:[], currentScenario:null, selectedScenario:null,
    flashIndex:0, flashFlipped:false, knownTerms:{},
    quiz:{active:false, items:[], index:0, correct:0, responses:[]}
  };

  function loadState(){
    try{
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      state = {...state, ...saved, quiz:{...state.quiz, ...(saved.quiz || {})}};
      if(!data[state.track]) state.track='general';
      if(!data[state.track][state.level]) state.level='cell';
    }catch(err){ console.warn('Could not load saved state', err); }
  }
  function saveState(){
    const copy = {...state, currentScenario:null, selectedScenario:null};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
  }
  function toast(msg){
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(()=>el.classList.remove('show'), 2600);
  }
  function norm(s){ return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
  function shuffle(arr){
    const a = [...arr];
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }
  function pool(track=state.track, level=state.level){ return data[track][level]; }
  function allTerms(track=state.track){
    return ['cell','tissue','organ','human'].flatMap(level => data[track][level].map(item => ({...item, level})));
  }
  function currentTerm(){
    const p = pool();
    if(state.selectedTermIndex >= p.length) state.selectedTermIndex = 0;
    return p[state.selectedTermIndex];
  }
  function setFeedback(message, type='neutral'){
    const box = $('feedbackBox');
    box.textContent = message;
    box.classList.remove('correct','wrong');
    if(type === 'correct') box.classList.add('correct');
    if(type === 'wrong') box.classList.add('wrong');
  }
  function award(points, isCorrect=true){
    state.attempts += 1;
    if(isCorrect){
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      state.xp += points;
    }else{
      state.streak = 0;
      state.xp = Math.max(0, state.xp - Math.min(3, points));
    }
    saveState();
    updateMetrics();
  }
  function accuracy(){ return state.attempts ? Math.round((state.correct/state.attempts)*100) : 0; }
  function mastery(){
    const totalTerms = Object.values(data).flatMap(track => ['cell','tissue','organ','human'].flatMap(level => track[level].map(x => x.term))).length;
    const known = Object.keys(state.knownTerms || {}).length;
    const xpPart = Math.min(60, state.xp);
    const knownPart = totalTerms ? Math.round((known/totalTerms)*40) : 0;
    return Math.min(100, xpPart + knownPart);
  }

  function updateMetrics(){
    $('scoreValue').textContent = state.xp;
    $('streakValue').textContent = state.streak;
    $('masteryValue').textContent = mastery() + '%';
    $('masteryMeter').style.width = mastery() + '%';
    $('heroCorrect').textContent = state.correct;
    $('heroAttempts').textContent = state.attempts;
    $('heroAccuracy').textContent = accuracy() + '%';
    const term = currentTerm();
    const trackLabel = data[state.track].label;
    $('statusBox').textContent = `${trackLabel} | ${levelLabels[state.level].title} focus | ${term.term}`;
  }

  function updateDifficultyLabel(){
    const label = state.difficulty === 1 ? 'Level 1: foundational recognition' : state.difficulty === 2 ? 'Level 2: interpretation and word parts' : 'Level 3: clinical reasoning';
    $('difficultyLabel').textContent = label;
  }

  function setTab(tab){
    state.activeTab = tab;
    tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    Object.entries(sections).forEach(([name, section]) => section.classList.toggle('active', name === tab));
    renderPrompt();
    if(tab === 'quiz' && !state.quiz.active) startQuiz();
    saveState();
  }
  function setLevel(level){
    state.level = level;
    state.selectedTermIndex = 0;
    state.assembly = [];
    document.querySelectorAll('.level-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.level === level));
    document.querySelectorAll('.level-node').forEach(node => node.style.opacity = node.dataset.level === level ? '1' : '.58');
    const lvl = levelLabels[level];
    $('activeLevelText').textContent = `Focus: ${lvl.title} — ${lvl.desc}`;
    renderAll();
    saveState();
  }
  function setTrack(track){
    state.track = track;
    state.selectedTermIndex = 0;
    state.assembly = [];
    state.flashIndex = 0;
    state.quiz.active = false;
    renderAll();
    saveState();
  }

  function renderPrompt(){
    const t = currentTerm();
    const trackLabel = data[state.track].label;
    const levelLabel = levelLabels[state.level];
    let title = `${levelLabel.icon} ${levelLabel.title} focus`;
    let text = `Current term: ${t.term}. Use the active mode to practice meaning, word parts, and context.`;
    if(state.activeTab === 'assembly') text = `Build “${t.term}” from its word parts. Clue: ${t.clue}.`;
    if(state.activeTab === 'scenario' && state.currentScenario) text = state.currentScenario.text;
    if(state.activeTab === 'match') text = `Match ${trackLabel.toLowerCase()} terms to definitions.`;
    if(state.activeTab === 'flashcards') text = `Flip terms from the ${trackLabel.toLowerCase()} deck.`;
    if(state.activeTab === 'quiz') text = 'Answer 10 mixed questions from the current terminology track.';
    $('promptTitle').textContent = title;
    $('promptText').textContent = text;
    $('promptPills').innerHTML = [trackLabel, levelLabel.title, `Difficulty ${state.difficulty}`, state.activeTab].map(x=>`<span class="pill">${escapeHTML(x)}</span>`).join('');
  }

  function escapeHTML(s){
    return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function renderExplorer(){
    const deck = $('termDeck');
    deck.innerHTML = '';
    pool().forEach((term, idx)=>{
      const btn = document.createElement('button');
      btn.className = 'term-button' + (idx === state.selectedTermIndex ? ' active' : '');
      btn.innerHTML = `<strong>${escapeHTML(term.term)}</strong><span>${escapeHTML(term.meaning)}</span><span>Parts: ${escapeHTML(term.parts.join(' + '))}</span>`;
      btn.addEventListener('click', ()=>{
        state.selectedTermIndex = idx;
        state.assembly = [];
        renderAll();
        toast(`Selected ${term.term}`);
      });
      deck.appendChild(btn);
    });
  }

  function renderAssembly(){
    const t = currentTerm();
    $('assemblyGuide').textContent = `Clue: ${t.clue}. Target term: ${t.term}.`;
    $('assemblyMeaning').textContent = 'Build the term first. Then press Check to reveal the meaning.';
    renderDropZone();
    renderWordBank();
  }
  function renderDropZone(){
    const drop = $('assemblyDrop');
    drop.innerHTML = '';
    if(!state.assembly.length){
      const hint = document.createElement('span');
      hint.className = 'drop-hint';
      hint.textContent = 'Drop or tap parts here...';
      drop.appendChild(hint);
    } else {
      state.assembly.forEach((part, idx)=>{
        const chip = document.createElement('button');
        chip.className = 'chip selected';
        chip.type = 'button';
        chip.textContent = part;
        chip.title = 'Remove this part';
        chip.addEventListener('click', ()=>{ state.assembly.splice(idx,1); renderAssembly(); });
        drop.appendChild(chip);
      });
    }
    $('assembledTerm').textContent = state.assembly.join('');
  }
  function renderWordBank(){
    const t = currentTerm();
    const bank = $('wordBank');
    bank.innerHTML = '';
    const remaining = t.parts.filter((part, idx)=>{
      const usedCount = state.assembly.filter(x=>x===part).length;
      const upToIndex = t.parts.slice(0, idx+1).filter(x=>x===part).length;
      return usedCount < upToIndex;
    });
    shuffle(remaining).forEach(part=>{
      const chip = document.createElement('button');
      chip.className = 'chip draggable';
      chip.type = 'button';
      chip.textContent = part;
      chip.draggable = true;
      chip.addEventListener('click', ()=>addPart(part));
      chip.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', part); });
      bank.appendChild(chip);
    });
  }
  function addPart(part){
    state.assembly.push(part);
    renderAssembly();
  }

  function renderScenario(){
    if(!state.currentScenario){
      state.currentScenario = pickScenario();
      state.selectedScenario = null;
    }
    const s = state.currentScenario;
    $('scenarioClue').textContent = s.text;
    $('scenarioReason').textContent = 'Select the best term. The explanation will appear after checking.';
    const options = buildScenarioOptions(s.answer);
    const list = $('scenarioOptions');
    list.innerHTML = '';
    options.forEach((opt, idx)=>{
      const btn = document.createElement('button');
      btn.className = 'option' + (state.selectedScenario === opt ? ' selected' : '');
      btn.type = 'button';
      btn.innerHTML = `<span class="option-marker">${String.fromCharCode(65+idx)}</span><span>${escapeHTML(opt)}</span>`;
      btn.addEventListener('click', ()=>{
        state.selectedScenario = opt;
        renderScenario();
      });
      list.appendChild(btn);
    });
  }
  function pickScenario(){ return shuffle(scenarioBank[state.track])[0]; }
  function buildScenarioOptions(answer){
    const terms = allTerms(state.track).map(x=>x.term);
    const distractors = shuffle(terms.filter(x=>norm(x)!==norm(answer))).slice(0,3);
    return shuffle([answer, ...distractors]);
  }

  function renderMatch(){
    const items = allTerms(state.track).slice(0,8);
    const defs = shuffle(items);
    const rows = $('matchRows');
    const bank = $('definitionBank');
    rows.innerHTML = '';
    bank.innerHTML = '';
    items.forEach(item=>{
      const row = document.createElement('div');
      row.className = 'match-row';
      row.innerHTML = `<label for="match_${item.term}">${escapeHTML(item.term)}</label>`;
      const sel = document.createElement('select');
      sel.id = `match_${item.term}`;
      sel.dataset.term = item.term;
      sel.innerHTML = `<option value="">Choose definition</option>` + defs.map(d=>`<option value="${escapeHTML(d.meaning)}">${escapeHTML(d.meaning)}</option>`).join('');
      const result = document.createElement('div');
      result.id = `result_${item.term}`;
      result.className = 'inline-result';
      result.textContent = 'Not checked';
      row.appendChild(sel);
      row.appendChild(result);
      rows.appendChild(row);
    });
    defs.forEach(item=>{
      const card = document.createElement('div');
      card.className = 'def-card';
      card.innerHTML = `<strong>${escapeHTML(item.meaning)}</strong><div>Category: ${escapeHTML(item.category)} | Level: ${escapeHTML(levelLabels[item.level].title)}</div>`;
      bank.appendChild(card);
    });
  }

  function renderFlashcards(){
    const terms = allTerms(state.track);
    if(state.flashIndex >= terms.length) state.flashIndex = 0;
    const card = terms[state.flashIndex];
    $('flashMeta').textContent = `Card ${state.flashIndex+1} of ${terms.length} • ${levelLabels[card.level].title}`;
    $('flashFront').textContent = card.term;
    $('flashBack').innerHTML = `${escapeHTML(card.meaning)}<br><br><strong>Parts:</strong> ${escapeHTML(card.parts.join(' + '))}`;
    $('flashFront').classList.toggle('hidden', state.flashFlipped);
    $('flashBack').classList.toggle('hidden', !state.flashFlipped);
    $('flashStatus').textContent = `Deck: ${data[state.track].label}. Known terms are saved locally.`;
    const queue = $('flashQueue');
    queue.innerHTML = '';
    terms.forEach((item, idx)=>{
      const key = `${state.track}:${item.level}:${item.term}`;
      const btn = document.createElement('button');
      btn.className = 'term-button' + (idx === state.flashIndex ? ' active' : '');
      btn.innerHTML = `<strong>${escapeHTML(item.term)} ${state.knownTerms[key] ? '✓' : ''}</strong><span>${escapeHTML(item.meaning)}</span>`;
      btn.addEventListener('click', ()=>{ state.flashIndex = idx; state.flashFlipped=false; renderFlashcards(); renderPrompt(); });
      queue.appendChild(btn);
    });
  }

  function startQuiz(){
    const terms = allTerms(state.track);
    const questions = [];
    const shuffledTerms = shuffle(terms);
    for(let i=0;i<Math.min(10, shuffledTerms.length);i++){
      const term = shuffledTerms[i];
      const type = i % 2 === 0 ? 'definition' : 'term';
      if(type === 'definition'){
        const options = shuffle([term.meaning, ...shuffle(terms.filter(x=>x.term!==term.term)).slice(0,3).map(x=>x.meaning)]);
        questions.push({type, prompt:`What is the best meaning of “${term.term}”?`, answer:term.meaning, options, term});
      } else {
        const options = shuffle([term.term, ...shuffle(terms.filter(x=>x.term!==term.term)).slice(0,3).map(x=>x.term)]);
        questions.push({type, prompt:`Which term matches this meaning: ${term.meaning}?`, answer:term.term, options, term});
      }
    }
    state.quiz = {active:true, items:questions, index:0, correct:0, responses:[]};
    renderQuiz();
    renderPrompt();
    saveState();
  }
  function renderQuiz(){
    if(!state.quiz.active || !state.quiz.items.length){
      $('quizQuestion').textContent = 'Press Start new 10-question check.';
      $('quizOptions').innerHTML = '';
      $('quizCounter').textContent = 'Not started';
      return;
    }
    const item = state.quiz.items[state.quiz.index];
    $('quizCounter').textContent = `Question ${state.quiz.index+1} of ${state.quiz.items.length}`;
    $('quizQuestion').textContent = item.prompt;
    const existing = state.quiz.responses[state.quiz.index];
    const list = $('quizOptions');
    list.innerHTML = '';
    item.options.forEach((opt, idx)=>{
      const btn = document.createElement('button');
      btn.type = 'button';
      let cls = 'option';
      if(existing){
        if(opt === item.answer) cls += ' correct';
        else if(opt === existing.selected) cls += ' wrong';
      }
      btn.className = cls;
      btn.disabled = !!existing;
      btn.innerHTML = `<span class="option-marker">${String.fromCharCode(65+idx)}</span><span>${escapeHTML(opt)}</span>`;
      btn.addEventListener('click', ()=>answerQuiz(opt));
      list.appendChild(btn);
    });
    renderQuizResults();
  }
  function answerQuiz(selected){
    const item = state.quiz.items[state.quiz.index];
    const isCorrect = selected === item.answer;
    if(!state.quiz.responses[state.quiz.index]){
      state.quiz.responses[state.quiz.index] = {selected, correct:item.answer, isCorrect, prompt:item.prompt};
      if(isCorrect) state.quiz.correct += 1;
      award(isCorrect ? 8 : 5, isCorrect);
      setFeedback(isCorrect ? 'Correct.' : `Not quite. Correct answer: ${item.answer}.`, isCorrect ? 'correct' : 'wrong');
      $('answerBox').textContent = `${item.term.term}: ${item.term.meaning}. Parts: ${item.term.parts.join(' + ')}.`;
      renderQuiz();
      saveState();
    }
  }
  function nextQuiz(){
    if(!state.quiz.active) return startQuiz();
    if(state.quiz.index < state.quiz.items.length - 1){
      state.quiz.index += 1;
      renderQuiz();
      saveState();
    } else {
      setFeedback(`Quick check complete: ${state.quiz.correct} of ${state.quiz.items.length} correct.`, state.quiz.correct >= 8 ? 'correct' : 'neutral');
      toast('Quick check complete');
    }
  }
  function renderQuizResults(){
    const target = $('quizResults');
    if(!state.quiz.active || !state.quiz.items.length){ target.textContent = 'No quiz results yet.'; return; }
    const rows = state.quiz.responses.filter(Boolean);
    if(!rows.length){ target.textContent = 'Answer questions to build a results table.'; return; }
    target.innerHTML = `<table class="results-table"><thead><tr><th>#</th><th>Result</th><th>Your answer</th><th>Correct</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.isCorrect ? 'Correct' : 'Review'}</td><td>${escapeHTML(r.selected)}</td><td>${escapeHTML(r.correct)}</td></tr>`).join('')}</tbody></table>`;
  }

  function checkCurrent(){
    if(state.activeTab === 'explorer'){
      const t = currentTerm();
      $('answerBox').textContent = `${t.term}: ${t.meaning}. Word parts: ${t.parts.join(' + ')}. Category: ${t.category}.`;
      setFeedback('Explorer mode is for review. Use Assembly, Scenario, Match, Flashcards, or Quick Check for scored practice.', 'neutral');
      return;
    }
    if(state.activeTab === 'assembly'){
      const t = currentTerm();
      const attempt = state.assembly.join('');
      const target = t.parts.join('');
      const correct = attempt === target;
      award(correct ? 10 : 7, correct);
      $('assemblyMeaning').textContent = `${t.term}: ${t.meaning}.`;
      $('answerBox').textContent = correct ? `Correct: ${t.parts.join(' + ')} = ${t.term}.` : `Correct order: ${t.parts.join(' + ')} = ${t.term}.`;
      setFeedback(correct ? 'Correct assembly. Good word-part recognition.' : 'The order is not correct yet. Review the clue and try again.', correct ? 'correct' : 'wrong');
      return;
    }
    if(state.activeTab === 'scenario'){
      const s = state.currentScenario;
      if(!state.selectedScenario){ setFeedback('Select an answer choice first.', 'neutral'); return; }
      const correct = norm(state.selectedScenario) === norm(s.answer);
      award(correct ? 10 : 7, correct);
      $('scenarioReason').textContent = s.reason;
      $('answerBox').textContent = `Best term: ${s.answer}. ${s.reason}`;
      setFeedback(correct ? 'Correct clinical interpretation.' : `Review the clue. Best term: ${s.answer}.`, correct ? 'correct' : 'wrong');
      document.querySelectorAll('#scenarioOptions .option').forEach(btn=>{
        const txt = btn.textContent.slice(1).trim();
        btn.classList.toggle('correct', norm(txt) === norm(s.answer));
        btn.classList.toggle('wrong', norm(txt) === norm(state.selectedScenario) && !correct);
      });
      return;
    }
    if(state.activeTab === 'match'){
      const terms = allTerms(state.track).slice(0,8);
      let correctCount = 0;
      terms.forEach(item=>{
        const sel = document.querySelector(`#matchRows select[data-term="${CSS.escape(item.term)}"]`);
        const res = $(`result_${item.term}`);
        const ok = sel && sel.value === item.meaning;
        if(ok) correctCount += 1;
        if(res){ res.textContent = ok ? 'Correct' : `Review: ${item.meaning}`; res.className = 'inline-result ' + (ok ? 'ok' : 'no'); }
      });
      const allCorrect = correctCount === terms.length;
      award(allCorrect ? 12 : 6, allCorrect);
      $('answerBox').textContent = `${correctCount} of ${terms.length} matches correct.`;
      setFeedback(`${correctCount} of ${terms.length} matches correct.`, allCorrect ? 'correct' : 'wrong');
      return;
    }
    if(state.activeTab === 'flashcards'){
      state.flashFlipped = !state.flashFlipped;
      renderFlashcards();
      return;
    }
    if(state.activeTab === 'quiz'){
      const item = state.quiz.items[state.quiz.index];
      if(item && !state.quiz.responses[state.quiz.index]) setFeedback('Select one of the answer choices in the quiz panel.', 'neutral');
      else nextQuiz();
    }
  }

  function newPrompt(){
    if(state.activeTab === 'scenario'){
      state.currentScenario = pickScenario();
      state.selectedScenario = null;
      $('reasoningText').value = '';
      renderScenario();
    } else if(state.activeTab === 'quiz'){
      startQuiz();
    } else if(state.activeTab === 'flashcards'){
      state.flashIndex = (state.flashIndex + 1) % allTerms(state.track).length;
      state.flashFlipped = false;
      renderFlashcards();
    } else {
      state.selectedTermIndex = (state.selectedTermIndex + 1) % pool().length;
      state.assembly = [];
      renderAll();
    }
    setFeedback('New prompt loaded.', 'neutral');
    saveState();
  }

  function showHint(){
    const t = currentTerm();
    if(state.activeTab === 'assembly'){
      const next = t.parts[state.assembly.length];
      setFeedback(next ? `Hint: the next part is “${next}.”` : `Hint: the assembled term should be “${t.term}.”`, 'neutral');
    } else if(state.activeTab === 'scenario' && state.currentScenario){
      setFeedback(`Hint: think about this concept — ${state.currentScenario.reason}`, 'neutral');
    } else if(state.activeTab === 'match'){
      setFeedback('Hint: match broad meaning first, then check category patterns in the definition bank.', 'neutral');
    } else if(state.activeTab === 'quiz'){
      const item = state.quiz.items[state.quiz.index];
      if(item) setFeedback(`Hint: this item relates to ${item.term.category}.`, 'neutral');
    } else {
      setFeedback(`Hint: ${t.clue}.`, 'neutral');
    }
  }

  function markKnown(known){
    const terms = allTerms(state.track);
    const card = terms[state.flashIndex];
    const key = `${state.track}:${card.level}:${card.term}`;
    if(known){
      state.knownTerms[key] = {date:new Date().toISOString(), meaning:card.meaning};
      award(4, true);
      toast('Marked known');
    } else {
      delete state.knownTerms[key];
      state.streak = 0;
      toast('Marked for review');
    }
    state.flashIndex = (state.flashIndex + 1) % terms.length;
    state.flashFlipped = false;
    renderAll();
    saveState();
  }

  function resetProgress(){
    if(confirm('Reset local progress for this simulator?')){
      localStorage.removeItem(STORAGE_KEY);
      state.xp=0; state.correct=0; state.attempts=0; state.streak=0; state.bestStreak=0; state.knownTerms={}; state.quiz={active:false,items:[],index:0,correct:0,responses:[]};
      renderAll();
      toast('Progress reset');
    }
  }

  function exportSummary(){
    const summary = {
      app:'RTApps Terminology Builder',
      exported_at:new Date().toISOString(),
      track:data[state.track].label,
      level:levelLabels[state.level].title,
      xp:state.xp,
      correct:state.correct,
      attempts:state.attempts,
      accuracy_percent:accuracy(),
      streak:state.streak,
      best_streak:state.bestStreak,
      mastery_percent:mastery(),
      known_terms:state.knownTerms,
      quiz_responses:state.quiz.responses
    };
    $('exportPre').textContent = JSON.stringify(summary, null, 2);
    $('exportModal').classList.add('open');
  }

  function downloadJSON(){
    const blob = new Blob([$('exportPre').textContent], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rtapps_terminology_builder_progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  async function copyJSON(){
    try{ await navigator.clipboard.writeText($('exportPre').textContent); toast('Copied export JSON'); }
    catch(err){ toast('Copy failed. Select and copy manually.'); }
  }

  function renderAll(){
    $('trackSelect').value = state.track;
    $('difficultyRange').value = state.difficulty;
    document.querySelectorAll('.level-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.level === state.level));
    document.querySelectorAll('.level-node').forEach(node => node.style.opacity = node.dataset.level === state.level ? '1' : '.58');
    $('activeLevelText').textContent = `Focus: ${levelLabels[state.level].title} — ${levelLabels[state.level].desc}`;
    updateDifficultyLabel();
    renderPrompt();
    renderExplorer();
    renderAssembly();
    renderScenario();
    renderMatch();
    renderFlashcards();
    renderQuiz();
    updateMetrics();
  }

  function bindEvents(){
    tabs.forEach(btn => btn.addEventListener('click', ()=>setTab(btn.dataset.tab)));
    $('trackSelect').addEventListener('change', e=>setTrack(e.target.value));
    $('difficultyRange').addEventListener('input', e=>{ state.difficulty = Number(e.target.value); updateDifficultyLabel(); renderPrompt(); saveState(); });
    document.querySelectorAll('.level-btn').forEach(btn => btn.addEventListener('click', ()=>setLevel(btn.dataset.level)));
    document.querySelectorAll('.level-node').forEach(node => {
      node.addEventListener('click', ()=>setLevel(node.dataset.level));
      node.addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); setLevel(node.dataset.level); }});
    });
    $('assemblyDrop').addEventListener('dragover', e=>{ e.preventDefault(); $('assemblyDrop').classList.add('over'); });
    $('assemblyDrop').addEventListener('dragleave', ()=> $('assemblyDrop').classList.remove('over'));
    $('assemblyDrop').addEventListener('drop', e=>{ e.preventDefault(); $('assemblyDrop').classList.remove('over'); const part=e.dataTransfer.getData('text/plain'); if(part) addPart(part); });
    $('undoPartBtn').addEventListener('click', ()=>{ state.assembly.pop(); renderAssembly(); });
    $('clearAssemblyBtn').addEventListener('click', ()=>{ state.assembly = []; renderAssembly(); });
    $('checkBtn').addEventListener('click', checkCurrent);
    $('newBtn').addEventListener('click', newPrompt);
    $('hintBtn').addEventListener('click', showHint);
    $('resetBtn').addEventListener('click', resetProgress);
    $('flipCardBtn').addEventListener('click', ()=>{ state.flashFlipped = !state.flashFlipped; renderFlashcards(); });
    $('flashcard').addEventListener('click', ()=>{ state.flashFlipped = !state.flashFlipped; renderFlashcards(); });
    $('flashcard').addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); state.flashFlipped = !state.flashFlipped; renderFlashcards(); }});
    $('knownBtn').addEventListener('click', ()=>markKnown(true));
    $('reviewBtn').addEventListener('click', ()=>markKnown(false));
    $('startQuizBtn').addEventListener('click', startQuiz);
    $('nextQuizBtn').addEventListener('click', nextQuiz);
    $('helpBtn').addEventListener('click', ()=> $('helpModal').classList.add('open'));
    $('closeHelpBtn').addEventListener('click', ()=> $('helpModal').classList.remove('open'));
    $('helpModal').addEventListener('click', e=>{ if(e.target === $('helpModal')) $('helpModal').classList.remove('open'); });
    $('exportBtn').addEventListener('click', exportSummary);
    $('closeExportBtn').addEventListener('click', ()=> $('exportModal').classList.remove('open'));
    $('exportModal').addEventListener('click', e=>{ if(e.target === $('exportModal')) $('exportModal').classList.remove('open'); });
    $('downloadJsonBtn').addEventListener('click', downloadJSON);
    $('copyJsonBtn').addEventListener('click', copyJSON);
    $('printBtn').addEventListener('click', ()=>window.print());
    document.addEventListener('keydown', e=>{
      if(e.key === 'Escape'){
        $('helpModal').classList.remove('open');
        $('exportModal').classList.remove('open');
      }
      if(e.altKey && e.key.toLowerCase() === 'n') newPrompt();
      if(e.altKey && e.key.toLowerCase() === 'c') checkCurrent();
    });
  }

  function init(){
    loadState();
    bindEvents();
    setTab(state.activeTab || 'explorer');
    renderAll();
    setFeedback('Ready. Choose an activity and press New prompt or Check.', 'neutral');
  }

  init();
})();
