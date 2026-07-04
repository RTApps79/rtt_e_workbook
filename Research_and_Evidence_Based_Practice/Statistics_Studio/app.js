/* RTApps Statistics Studio - app.js */
(function () {
  "use strict";

  const S = window.RTStats;
  const C = window.RTCharts;

  const state = {
    rows: [],
    columns: [],
    datasetName: "No dataset loaded",
    lastResults: [],
    samples: {}
  };

  const SAMPLE_DATASETS = {
    "Pre/Post Scores": `student_id,group,pre_score,post_score,confidence_rating
001,A,72,86,4
002,A,68,81,5
003,A,75,88,4
004,A,70,84,4
005,A,80,90,5
006,B,66,77,3
007,B,71,82,4
008,B,74,85,4
009,B,69,80,3
010,B,77,89,5`,
    "Two-Group Scores": `student_id,group,score,time_minutes
001,Group A,88,24
002,Group A,91,21
003,Group A,84,27
004,Group A,90,22
005,Group A,87,25
006,Group B,79,31
007,Group B,82,29
008,Group B,76,35
009,Group B,85,28
010,Group B,81,30`,
    "Categorical Outcomes": `student_id,section,outcome
001,Morning,Pass
002,Morning,Pass
003,Morning,Pass
004,Morning,Needs Review
005,Morning,Pass
006,Afternoon,Pass
007,Afternoon,Needs Review
008,Afternoon,Needs Review
009,Afternoon,Pass
010,Afternoon,Needs Review`,
    "Confusion Matrix Data": `case_id,actual_status,learner_response
001,positive,positive
002,negative,negative
003,positive,negative
004,negative,positive
005,positive,positive
006,negative,negative
007,negative,negative
008,positive,positive
009,negative,positive
010,positive,negative`,
    "Likert Survey": `student_id,item_1,item_2,item_3,item_4,overall_satisfaction
001,4,5,4,4,5
002,3,4,4,3,4
003,5,5,5,4,5
004,4,4,3,4,4
005,2,3,3,2,3
006,5,4,5,5,5
007,4,4,4,4,4
008,3,3,4,3,3
009,5,5,4,5,5
010,4,5,5,4,5`
  };

  function $(id) { return document.getElementById(id); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }
  function esc(s) { return String(s ?? "").replace(/[&<>'"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[ch])); }

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    setupNavigation();
    populateSampleButtons();
    setupDataHandlers();
    setupAnalysisHandlers();
    loadSample("Pre/Post Scores");
  }

  function setupNavigation() {
    qsa(".nav-button").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        qsa(".nav-button").forEach(b => b.classList.toggle("active", b === btn));
        qsa(".panel").forEach(p => p.classList.toggle("hidden", p.id !== target));
        const activePanel = $(target);
        if (activePanel) activePanel.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function populateSampleButtons() {
    const container = $("sampleButtons");
    container.innerHTML = "";
    Object.keys(SAMPLE_DATASETS).forEach(name => {
      const btn = document.createElement("button");
      btn.className = "small secondary";
      btn.textContent = name;
      btn.addEventListener("click", () => loadSample(name));
      container.appendChild(btn);
    });
  }

  function setupDataHandlers() {
    $("loadCsvButton").addEventListener("click", () => loadFromTextarea());
    $("clearDataButton").addEventListener("click", clearData);
    $("downloadCsvButton").addEventListener("click", downloadCurrentCSV);
    $("csvFileInput").addEventListener("change", handleFileUpload);
    $("copySampleButton").addEventListener("click", () => navigator.clipboard?.writeText($("csvInput").value));
    $("printReportButton").addEventListener("click", () => window.print());
    $("downloadResultsJsonButton").addEventListener("click", downloadResultsJSON);
    $("downloadResultsCsvButton").addEventListener("click", downloadResultsCSV);
  }

  function setupAnalysisHandlers() {
    $("runDescriptive").addEventListener("click", runDescriptive);
    $("runFrequency").addEventListener("click", runFrequency);
    $("runIndependentT").addEventListener("click", runIndependentT);
    $("runPairedT").addEventListener("click", runPairedT);
    $("runAnova").addEventListener("click", runAnova);
    $("runCorrelation").addEventListener("click", runCorrelation);
    $("runRegression").addEventListener("click", runRegression);
    $("runChiSquare").addEventListener("click", runChiSquare);
    $("runLikert").addEventListener("click", runLikert);
    $("runConfusionFromData").addEventListener("click", runConfusionFromData);
    $("runConfusionManual").addEventListener("click", runConfusionManual);
  }

  function loadSample(name) {
    $("csvInput").value = SAMPLE_DATASETS[name];
    state.datasetName = name;
    loadFromTextarea(name);
  }

  function loadFromTextarea(label = null) {
    try {
      const text = $("csvInput").value.trim();
      const rows = S.parseCSV(text);
      if (!rows.length) throw new Error("No rows were detected. Paste comma-separated data with a header row.");
      state.rows = rows;
      state.columns = S.inferColumns(rows);
      state.datasetName = label || $("datasetNameInput").value.trim() || "Pasted dataset";
      state.lastResults = [];
      updateDataStatus();
      populateVariableSelectors();
      renderPreview();
      clearAllResults();
    } catch (err) {
      showMessage("dataStatus", err.message, "bad");
    }
  }

  function clearData() {
    state.rows = [];
    state.columns = [];
    state.datasetName = "No dataset loaded";
    $("csvInput").value = "";
    updateDataStatus();
    populateVariableSelectors();
    renderPreview();
    clearAllResults();
  }

  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      $("csvInput").value = String(reader.result || "");
      state.datasetName = file.name;
      $("datasetNameInput").value = file.name;
      loadFromTextarea(file.name);
    };
    reader.onerror = () => showMessage("dataStatus", "Could not read the selected file.", "bad");
    reader.readAsText(file);
  }

  function updateDataStatus() {
    const el = $("dataStatus");
    if (!state.rows.length) {
      el.innerHTML = `<span class="pill warn">No active dataset</span><span class="help-text">Load a CSV file, paste data, or choose a sample dataset.</span>`;
      return;
    }
    const nRows = state.rows.length;
    const nCols = state.columns.length;
    const numeric = state.columns.filter(c => c.type.includes("numeric")).length;
    const categorical = nCols - numeric;
    el.innerHTML = `
      <span class="pill good">Dataset loaded</span>
      <span class="pill">${esc(state.datasetName)}</span>
      <span class="pill">${nRows} rows</span>
      <span class="pill">${nCols} variables</span>
      <span class="pill">${numeric} numeric/ordinal</span>
      <span class="pill">${categorical} categorical/text</span>`;
  }

  function showMessage(elementId, message, tone = "warn") {
    const klass = tone === "bad" ? "bad" : tone === "good" ? "good" : "warn";
    $(elementId).innerHTML = `<span class="pill ${klass}">${esc(message)}</span>`;
  }

  function renderPreview() {
    const target = $("dataPreview");
    if (!state.rows.length) {
      target.innerHTML = `<div class="help-text">No dataset loaded.</div>`;
      return;
    }
    const rows = state.rows.slice(0, 8);
    const headers = Object.keys(state.rows[0]);
    target.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>
          <tbody>${rows.map(r => `<tr>${headers.map(h => `<td>${esc(r[h])}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </div>
      <p class="help-text mt-1">Showing first ${rows.length} of ${state.rows.length} rows.</p>`;
  }

  function populateVariableSelectors() {
    const all = state.columns.map(c => c.name);
    const numeric = state.columns.filter(c => c.type.includes("numeric")).map(c => c.name);
    const categorical = state.columns.filter(c => !c.type.includes("numeric") || c.type === "numeric_or_ordinal").map(c => c.name);

    fillSelect("descVariable", numeric, false);
    fillSelect("freqVariable", all, false);
    fillSelect("indGroupVar", categorical, false);
    fillSelect("indNumericVar", numeric, false);
    fillSelect("indGroupA", [], false);
    fillSelect("indGroupB", [], false);
    fillSelect("pairedBeforeVar", numeric, false);
    fillSelect("pairedAfterVar", numeric, false);
    fillSelect("anovaGroupVar", categorical, false);
    fillSelect("anovaNumericVar", numeric, false);
    fillSelect("corrXVar", numeric, false);
    fillSelect("corrYVar", numeric, false);
    fillSelect("regXVar", numeric, false);
    fillSelect("regYVar", numeric, false);
    fillSelect("chiRowVar", categorical, false);
    fillSelect("chiColVar", categorical, false);
    fillSelect("likertVars", numeric, true);
    fillSelect("confActualVar", all, false);
    fillSelect("confPredictedVar", all, false);

    ["indGroupVar"].forEach(id => {
      const el = $(id);
      el.onchange = updateGroupLevelSelectors;
    });
    updateGroupLevelSelectors();
  }

  function fillSelect(id, values, multiple) {
    const el = $(id);
    if (!el) return;
    el.innerHTML = values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    el.multiple = !!multiple;
    if (multiple) {
      Array.from(el.options).slice(0, Math.min(4, el.options.length)).forEach(o => o.selected = true);
    } else if (el.options.length) {
      el.selectedIndex = 0;
    }
  }

  function updateGroupLevelSelectors() {
    const groupVar = $("indGroupVar").value;
    if (!groupVar || !state.rows.length) {
      fillSelect("indGroupA", [], false);
      fillSelect("indGroupB", [], false);
      return;
    }
    const levels = S.frequency(state.rows.map(r => r[groupVar])).rows.map(r => r.value);
    fillSelect("indGroupA", levels, false);
    fillSelect("indGroupB", levels, false);
    if ($("indGroupB").options.length > 1) $("indGroupB").selectedIndex = 1;
  }

  function requireData() {
    if (!state.rows.length) throw new Error("Load a dataset before running an analysis.");
  }

  function clearAllResults() {
    ["descResults", "freqResults", "groupResults", "relationshipResults", "categoricalResults", "likertResults", "confusionResults", "exportResults"].forEach(id => {
      const el = $(id); if (el) el.innerHTML = "";
    });
  }

  function recordResult(type, result) {
    state.lastResults.push({ type, timestamp: new Date().toISOString(), dataset: state.datasetName, result });
    renderExportSummary();
  }

  function runDescriptive() {
    try {
      requireData();
      const variable = $("descVariable").value;
      const values = S.numericValues(state.rows, variable);
      const d = S.descriptive(values);
      const tableRows = [
        ["N", d.n], ["Mean", d.mean], ["Median", d.median], ["Standard deviation", d.sd], ["Variance", d.variance],
        ["Minimum", d.min], ["Q1", d.q1], ["Q3", d.q3], ["IQR", d.iqr], ["Maximum", d.max], ["Range", d.range],
        ["Skewness", d.skewness], ["Excess kurtosis", d.kurtosis]
      ];
      const html = `
        <div class="result-card"><h3>Descriptive statistics: ${esc(variable)}</h3>${simpleTable(["Statistic", "Value"], tableRows.map(r => [r[0], S.formatNumber(r[1], 3)]))}</div>
        <div class="result-card"><h3>Plain-language interpretation</h3><div class="interpretation">The variable <strong>${esc(variable)}</strong> had ${d.n} valid observations. The mean was ${S.formatNumber(d.mean, 2)} and the standard deviation was ${S.formatNumber(d.sd, 2)}. The median was ${S.formatNumber(d.median, 2)}, with values ranging from ${S.formatNumber(d.min, 2)} to ${S.formatNumber(d.max, 2)}.</div></div>
        <div class="card-grid">
          <div class="result-card"><h3>Histogram</h3><div class="chart-box">${C.histogram(values, { title: `Histogram of ${variable}`, xLabel: variable })}</div></div>
          <div class="result-card"><h3>Box plot</h3><div class="chart-box">${C.boxPlot(values, { title: `Box plot of ${variable}` })}</div></div>
        </div>`;
      $("descResults").innerHTML = html;
      recordResult("descriptive", { variable, descriptive: d });
    } catch (err) { errorResult("descResults", err); }
  }

  function runFrequency() {
    try {
      requireData();
      const variable = $("freqVariable").value;
      const f = S.frequency(state.rows.map(r => r[variable]));
      const rows = f.rows.map(r => [r.value, r.count, S.formatNumber(r.percent, 1) + "%"]);
      const html = `
        <div class="result-card"><h3>Frequency table: ${esc(variable)}</h3>${simpleTable(["Value", "Count", "Percent"], rows)}</div>
        <div class="result-card"><h3>Plain-language interpretation</h3><div class="interpretation">The variable <strong>${esc(variable)}</strong> had ${f.validN} valid responses and ${f.missing} missing responses. The most frequent category was <strong>${esc(f.rows[0]?.value || "—")}</strong> (${f.rows[0]?.count || 0} responses).</div></div>
        <div class="result-card"><h3>Bar chart</h3><div class="chart-box">${C.barChart(f.rows, { title: `Frequency chart: ${variable}` })}</div></div>`;
      $("freqResults").innerHTML = html;
      recordResult("frequency", { variable, frequency: f });
    } catch (err) { errorResult("freqResults", err); }
  }

  function runIndependentT() {
    try {
      requireData();
      const groupVar = $("indGroupVar").value;
      const numericVar = $("indNumericVar").value;
      const selectedGroups = [$("indGroupA").value, $("indGroupB").value].filter(Boolean);
      const equalVariance = $("equalVarianceCheck").checked;
      if (selectedGroups[0] === selectedGroups[1]) throw new Error("Choose two different groups.");
      const r = S.independentTTest(state.rows, groupVar, numericVar, selectedGroups, equalVariance);
      const groupRows = [
        [r.group1, r.n1, S.formatNumber(r.mean1, 3), S.formatNumber(r.sd1, 3)],
        [r.group2, r.n2, S.formatNumber(r.mean2, 3), S.formatNumber(r.sd2, 3)]
      ];
      const statRows = [["Mean difference", S.formatNumber(r.difference, 3)], ["t", S.formatNumber(r.t, 3)], ["df", S.formatNumber(r.df, 2)], ["p", S.formatP(r.p)], ["Cohen's d", S.formatNumber(r.cohenD, 3)], ["Hedges' g", S.formatNumber(r.hedgesG, 3)]];
      $("groupResults").innerHTML = `
        <div class="result-card"><h3>${esc(r.method)}</h3>${simpleTable(["Group", "N", "Mean", "SD"], groupRows)}<div class="mt-2">${simpleTable(["Statistic", "Value"], statRows)}</div></div>
        <div class="result-card"><h3>APA-style result</h3><div class="interpretation">${esc(S.apaT(r))} The difference between groups ${esc(S.significancePhrase(r.p))}.</div></div>
        <div class="result-card"><h3>Assumption checklist</h3>${assumptionList(r.assumptions)}</div>`;
      recordResult("independent_t_test", r);
    } catch (err) { errorResult("groupResults", err); }
  }

  function runPairedT() {
    try {
      requireData();
      const beforeVar = $("pairedBeforeVar").value;
      const afterVar = $("pairedAfterVar").value;
      if (beforeVar === afterVar) throw new Error("Choose two different paired variables.");
      const r = S.pairedTTest(state.rows, beforeVar, afterVar);
      const rows = [["Complete pairs", r.n], ["Before mean", S.formatNumber(r.beforeMean, 3)], ["After mean", S.formatNumber(r.afterMean, 3)], ["Mean difference", S.formatNumber(r.meanDifference, 3)], ["SD of differences", S.formatNumber(r.sdDifference, 3)], ["t", S.formatNumber(r.t, 3)], ["df", r.df], ["p", S.formatP(r.p)], ["Cohen's dz", S.formatNumber(r.cohenDz, 3)]];
      $("groupResults").innerHTML = `
        <div class="result-card"><h3>${esc(r.method)}</h3>${simpleTable(["Statistic", "Value"], rows)}</div>
        <div class="result-card"><h3>APA-style result</h3><div class="interpretation">${esc(S.apaT(r))} The paired difference ${esc(S.significancePhrase(r.p))}.</div></div>
        <div class="result-card"><h3>Assumption checklist</h3>${assumptionList(r.assumptions)}</div>`;
      recordResult("paired_t_test", r);
    } catch (err) { errorResult("groupResults", err); }
  }

  function runAnova() {
    try {
      requireData();
      const groupVar = $("anovaGroupVar").value;
      const numericVar = $("anovaNumericVar").value;
      const r = S.oneWayANOVA(state.rows, groupVar, numericVar);
      const groupRows = r.groups.map(g => [g.key, g.n, S.formatNumber(g.mean, 3), S.formatNumber(g.sd, 3)]);
      const anovaRows = [
        ["Between groups", S.formatNumber(r.ssBetween, 3), r.dfBetween, S.formatNumber(r.msBetween, 3), S.formatNumber(r.F, 3), S.formatP(r.p)],
        ["Within groups", S.formatNumber(r.ssWithin, 3), r.dfWithin, S.formatNumber(r.msWithin, 3), "—", "—"],
        ["Total", S.formatNumber(r.ssTotal, 3), r.dfBetween + r.dfWithin, "—", "—", "—"]
      ];
      const compRows = r.comparisons.map(c => [
        `${c.groupA} vs. ${c.groupB}`, S.formatNumber(c.meanDifference, 3), S.formatNumber(c.t, 3),
        S.formatP(c.pRaw), S.formatP(c.pBonferroni)
      ]);
      $("groupResults").innerHTML = `
        <div class="result-card"><h3>Group descriptives</h3>${simpleTable(["Group", "N", "Mean", "SD"], groupRows)}</div>
        <div class="result-card"><h3>${esc(r.method)}</h3>${simpleTable(["Source", "SS", "df", "MS", "F", "p"], anovaRows)}
          <p class="help-text mt-1">&eta;&sup2; = ${S.formatNumber(r.etaSquared, 3)}</p></div>
        <div class="result-card"><h3>Pairwise comparisons (Bonferroni-corrected)</h3>${simpleTable(["Comparison", "Mean diff.", "t", "p (raw)", "p (Bonferroni)"], compRows)}
          <p class="help-text mt-1">Bonferroni correction multiplies each raw p-value by the number of comparisons (${r.comparisons.length}), capped at 1.0. This is a standard, transparent alternative to Tukey HSD.</p></div>
        <div class="result-card"><h3>APA-style result</h3><div class="interpretation">${esc(S.apaAnova(r))} The overall difference across groups ${esc(S.significancePhrase(r.p))}.</div></div>
        <div class="result-card"><h3>Assumption checklist</h3>${assumptionList(r.assumptions)}</div>`;
      recordResult("one_way_anova", r);
    } catch (err) { errorResult("groupResults", err); }
  }

  function runCorrelation() {
    try {
      requireData();
      const xVar = $("corrXVar").value;
      const yVar = $("corrYVar").value;
      if (xVar === yVar) throw new Error("Choose two different variables.");
      const r = S.pearsonCorrelation(state.rows, xVar, yVar);
      const pairs = S.pairedNumericValues(state.rows, xVar, yVar);
      const rows = [["N", r.n], ["Pearson r", S.formatNumber(r.r, 3)], ["R²", S.formatNumber(r.rSquared, 3)], ["t", S.formatNumber(r.t, 3)], ["df", r.df], ["p", S.formatP(r.p)], ["Direction", r.direction], ["Strength", r.strength]];
      $("relationshipResults").innerHTML = `
        <div class="result-card"><h3>${esc(r.method)}</h3>${simpleTable(["Statistic", "Value"], rows)}</div>
        <div class="result-card"><h3>APA-style result</h3><div class="interpretation">${esc(S.apaCorrelation(r))} The linear relationship ${esc(S.significancePhrase(r.p))}.</div></div>
        <div class="result-card"><h3>Scatterplot</h3><div class="chart-box">${C.scatterPlot(pairs, { title: `${xVar} and ${yVar}`, xLabel: xVar, yLabel: yVar })}</div></div>
        <div class="result-card"><h3>Assumption checklist</h3>${assumptionList(r.assumptions)}</div>`;
      recordResult("pearson_correlation", r);
    } catch (err) { errorResult("relationshipResults", err); }
  }

  function runRegression() {
    try {
      requireData();
      const xVar = $("regXVar").value;
      const yVar = $("regYVar").value;
      if (xVar === yVar) throw new Error("Choose different predictor and outcome variables.");
      const r = S.simpleRegression(state.rows, xVar, yVar);
      const pairs = S.pairedNumericValues(state.rows, xVar, yVar);
      const rows = [["N", r.n], ["Intercept", S.formatNumber(r.intercept, 3)], ["Slope", S.formatNumber(r.slope, 3)], ["R", S.formatNumber(r.r, 3)], ["R²", S.formatNumber(r.rSquared, 3)], ["SE slope", S.formatNumber(r.seSlope, 3)], ["t for slope", S.formatNumber(r.t, 3)], ["df", r.df], ["p", S.formatP(r.p)]];
      $("relationshipResults").innerHTML = `
        <div class="result-card"><h3>${esc(r.method)}</h3>${simpleTable(["Statistic", "Value"], rows)}<p class="help-text mt-1"><strong>Equation:</strong> ${esc(r.equation)}</p></div>
        <div class="result-card"><h3>APA-style result</h3><div class="interpretation">${esc(S.apaRegression(r))}</div></div>
        <div class="result-card"><h3>Scatterplot with regression line</h3><div class="chart-box">${C.scatterPlot(pairs, { title: `${xVar} predicting ${yVar}`, xLabel: xVar, yLabel: yVar, regression: r })}</div></div>
        <div class="result-card"><h3>Assumption checklist</h3>${assumptionList(r.assumptions)}</div>`;
      recordResult("simple_regression", r);
    } catch (err) { errorResult("relationshipResults", err); }
  }

  function runChiSquare() {
    try {
      requireData();
      const rowVar = $("chiRowVar").value;
      const colVar = $("chiColVar").value;
      if (rowVar === colVar) throw new Error("Choose two different categorical variables.");
      const r = S.chiSquareFromRows(state.rows, rowVar, colVar);
      const observedRows = r.rowLevels.map((level, i) => [level, ...r.observed[i], r.rowTotals[i]]);
      const expectedRows = r.rowLevels.map((level, i) => [level, ...r.expected[i].map(v => S.formatNumber(v, 2)), S.formatNumber(r.rowTotals[i], 0)]);
      const headers = [rowVar, ...r.colLevels, "Row total"];
      const statRows = [["χ²", S.formatNumber(r.chi2, 3)], ["df", r.df], ["N", r.total], ["p", S.formatP(r.p)], ["Cramer's V", S.formatNumber(r.cramersV, 3)], ["Expected cells < 5", r.lowExpected]];
      $("categoricalResults").innerHTML = `
        <div class="result-card"><h3>Observed counts</h3>${simpleTable(headers, observedRows)}</div>
        <div class="result-card"><h3>Expected counts</h3>${simpleTable(headers, expectedRows)}</div>
        <div class="result-card"><h3>${esc(r.method)}</h3>${simpleTable(["Statistic", "Value"], statRows)}</div>
        <div class="result-card"><h3>APA-style result</h3><div class="interpretation">${esc(S.apaChiSquare(r))} The association ${esc(S.significancePhrase(r.p))}.</div></div>
        <div class="result-card"><h3>Assumption checklist</h3>${assumptionList(r.assumptions)}</div>`;
      recordResult("chi_square", r);
    } catch (err) { errorResult("categoricalResults", err); }
  }

  function runLikert() {
    try {
      requireData();
      const vars = Array.from($("likertVars").selectedOptions).map(o => o.value);
      if (!vars.length) throw new Error("Select at least one Likert/ordinal variable.");
      const summaries = S.likertSummary(state.rows, vars);
      const tableRows = summaries.map(s => [s.variable, s.n, S.formatNumber(s.mean, 2), S.formatNumber(s.median, 2), S.formatNumber(s.sd, 2), S.formatNumber(s.min, 0), S.formatNumber(s.max, 0)]);
      const scaleValues = [];
      state.rows.forEach(r => {
        const vals = vars.map(v => S.toNumber(r[v])).filter(Number.isFinite);
        if (vals.length) scaleValues.push(S.mean(vals));
      });
      const scale = S.descriptive(scaleValues);
      $("likertResults").innerHTML = `
        <div class="result-card"><h3>Likert item summary</h3>${simpleTable(["Item", "N", "Mean", "Median", "SD", "Min", "Max"], tableRows)}</div>
        <div class="result-card"><h3>Simple scale summary</h3><div class="interpretation">Across selected items, the average scale score was ${S.formatNumber(scale.mean, 2)} (SD = ${S.formatNumber(scale.sd, 2)}, N = ${scale.n}). This simple scale average treats selected items as equally weighted and assumes higher values reflect more of the same construct.</div></div>
        <div class="result-card"><h3>Item distribution preview</h3>${summaries.map(s => `<h4>${esc(s.variable)}</h4><div class="chart-box">${C.barChart(s.frequencies, { title: s.variable, maxBars: 8 })}</div>`).join("")}</div>`;
      recordResult("likert_summary", { variables: vars, summaries, scale });
    } catch (err) { errorResult("likertResults", err); }
  }

  function runConfusionFromData() {
    try {
      requireData();
      const actualVar = $("confActualVar").value;
      const predictedVar = $("confPredictedVar").value;
      const positiveLabel = $("positiveLabel").value.trim() || "positive";
      if (actualVar === predictedVar) throw new Error("Choose different actual and response variables.");
      const r = S.confusionMatrixFromRows(state.rows, actualVar, predictedVar, positiveLabel);
      renderConfusion(r, "confusion_from_data");
    } catch (err) { errorResult("confusionResults", err); }
  }

  function runConfusionManual() {
    try {
      const tp = Number($("manualTP").value || 0);
      const tn = Number($("manualTN").value || 0);
      const fp = Number($("manualFP").value || 0);
      const fn = Number($("manualFN").value || 0);
      if ([tp, tn, fp, fn].some(v => !Number.isFinite(v) || v < 0)) throw new Error("Enter nonnegative counts for TP, TN, FP, and FN.");
      const r = S.confusionMetrics(tp, tn, fp, fn);
      renderConfusion(r, "confusion_manual");
    } catch (err) { errorResult("confusionResults", err); }
  }

  function renderConfusion(r, type) {
    const rows = [
      ["True positives", r.tp], ["True negatives", r.tn], ["False positives", r.fp], ["False negatives", r.fn], ["Total", r.total],
      ["Sensitivity", pct(r.sensitivity)], ["Specificity", pct(r.specificity)], ["Positive predictive value", pct(r.ppv)], ["Negative predictive value", pct(r.npv)], ["Accuracy", pct(r.accuracy)], ["F1 score", S.formatNumber(r.f1, 3)]
    ];
    $("confusionResults").innerHTML = `
      <div class="result-card"><h3>Confusion matrix counts and metrics</h3>${simpleTable(["Metric", "Value"], rows)}</div>
      <div class="result-card"><h3>Plain-language interpretation</h3><div class="interpretation">The model or learner response had an accuracy of ${pct(r.accuracy)}. Sensitivity was ${pct(r.sensitivity)}, meaning that this proportion of actual positive cases was identified as positive. Specificity was ${pct(r.specificity)}, meaning that this proportion of actual negative cases was identified as negative.</div></div>
      <div class="result-card"><h3>Confusion matrix visualization</h3><div class="chart-box">${C.confusionChart(r)}</div></div>`;
    recordResult(type, r);
  }

  function renderExportSummary() {
    const target = $("exportResults");
    if (!state.lastResults.length) {
      target.innerHTML = `<div class="help-text">Run at least one analysis to create an exportable summary.</div>`;
      return;
    }
    const rows = state.lastResults.map((r, i) => [i + 1, r.type, r.dataset, new Date(r.timestamp).toLocaleString()]);
    target.innerHTML = `<div class="result-card"><h3>Current analysis log</h3>${simpleTable(["#", "Analysis", "Dataset", "Time"], rows)}</div><div class="result-card"><h3>Report notes</h3><div class="interpretation">Use the export buttons above to download results. For formal grading or publication, verify assumptions, confirm the data-cleaning plan, and keep a copy of the original dataset.</div></div>`;
  }

  function downloadCurrentCSV() {
    if (!state.rows.length) return;
    downloadText(safeFilename(state.datasetName || "dataset") + ".csv", S.toCSV(state.rows), "text/csv");
  }

  function downloadResultsJSON() {
    if (!state.lastResults.length) return;
    downloadText("rtapps_statistics_results.json", JSON.stringify({ generatedAt: new Date().toISOString(), results: state.lastResults }, null, 2), "application/json");
  }

  function downloadResultsCSV() {
    if (!state.lastResults.length) return;
    const rows = state.lastResults.map((entry, i) => {
      const r = entry.result;
      return {
        index: i + 1,
        dataset: entry.dataset,
        analysis_type: entry.type,
        method: r.method || entry.type,
        variable_1: r.variable || r.numericVar || r.xVar || r.rowVar || r.actualVar || "",
        variable_2: r.groupVar || r.yVar || r.colVar || r.predictedVar || "",
        n: r.n || r.total || "",
        statistic: r.t ?? r.r ?? r.chi2 ?? r.slope ?? "",
        df: r.df ?? "",
        p: r.p ?? "",
        effect_size: r.cohenD ?? r.hedgesG ?? r.rSquared ?? r.cramersV ?? "",
        timestamp: entry.timestamp
      };
    });
    downloadText("rtapps_statistics_results_summary.csv", S.toCSV(rows), "text/csv");
  }

  function downloadText(filename, text, mime) {
    const blob = new Blob([text], { type: mime + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function safeFilename(name) {
    return String(name || "dataset").replace(/[^a-z0-9_\-]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase();
  }

  function simpleTable(headers, rows) {
    return `<div class="table-wrap"><table><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td class="${isNumericLike(cell) ? "numeric" : ""}">${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function assumptionList(items) {
    return `<ul class="assumption-list">${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul>`;
  }

  function errorResult(id, err) {
    $(id).innerHTML = `<div class="result-card"><h3>Unable to run analysis</h3><div class="interpretation" style="border-left-color: var(--danger); background:#fee2e2; color:#7f1d1d;">${esc(err.message || err)}</div></div>`;
  }

  function pct(v) {
    return Number.isFinite(v) ? `${S.formatNumber(v * 100, 1)}%` : "—";
  }

  function isNumericLike(v) {
    if (typeof v === "number") return true;
    const s = String(v ?? "").replace(/[%<>=.\s]/g, "");
    return s !== "" && !Number.isNaN(Number(s));
  }
})();
