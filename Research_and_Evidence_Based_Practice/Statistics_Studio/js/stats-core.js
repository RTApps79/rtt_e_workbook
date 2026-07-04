/*
  RTApps Statistics Studio - stats-core.js
  Browser-only educational statistics utilities.
  No external dependencies. Designed for small teaching datasets.
*/
(function (global) {
  "use strict";

  const EPS = 1e-12;

  function isMissing(value) {
    return value === null || value === undefined || String(value).trim() === "" || String(value).trim().toLowerCase() === "na" || String(value).trim().toLowerCase() === "n/a";
  }

  function toNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
    if (isMissing(value)) return NaN;
    const cleaned = String(value).trim().replace(/,/g, "").replace(/%$/, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }

  function numericValues(rows, variable) {
    return rows.map(r => toNumber(r[variable])).filter(Number.isFinite);
  }

  function pairedNumericValues(rows, xVar, yVar) {
    const out = [];
    rows.forEach(r => {
      const x = toNumber(r[xVar]);
      const y = toNumber(r[yVar]);
      if (Number.isFinite(x) && Number.isFinite(y)) out.push({ x, y });
    });
    return out;
  }

  function mean(values) {
    const arr = values.filter(Number.isFinite);
    if (!arr.length) return NaN;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function sum(values) {
    return values.filter(Number.isFinite).reduce((a, b) => a + b, 0);
  }

  function median(values) {
    return quantile(values, 0.5);
  }

  function quantile(values, p) {
    const arr = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
    if (!arr.length) return NaN;
    if (arr.length === 1) return arr[0];
    const pos = (arr.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (arr[base + 1] !== undefined) return arr[base] + rest * (arr[base + 1] - arr[base]);
    return arr[base];
  }

  function min(values) {
    const arr = values.filter(Number.isFinite);
    return arr.length ? Math.min(...arr) : NaN;
  }

  function max(values) {
    const arr = values.filter(Number.isFinite);
    return arr.length ? Math.max(...arr) : NaN;
  }

  function sampleVariance(values) {
    const arr = values.filter(Number.isFinite);
    if (arr.length < 2) return NaN;
    const m = mean(arr);
    return arr.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / (arr.length - 1);
  }

  function populationVariance(values) {
    const arr = values.filter(Number.isFinite);
    if (!arr.length) return NaN;
    const m = mean(arr);
    return arr.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / arr.length;
  }

  function sampleSD(values) {
    const v = sampleVariance(values);
    return Number.isFinite(v) ? Math.sqrt(v) : NaN;
  }

  function populationSD(values) {
    const v = populationVariance(values);
    return Number.isFinite(v) ? Math.sqrt(v) : NaN;
  }

  function mode(values) {
    const counts = new Map();
    values.filter(v => !isMissing(v)).forEach(v => {
      const key = String(v).trim();
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    if (!counts.size) return [];
    const highest = Math.max(...counts.values());
    return [...counts.entries()].filter(([, c]) => c === highest).map(([k]) => k);
  }

  function descriptive(values) {
    const arr = values.filter(Number.isFinite);
    const n = arr.length;
    const q1 = quantile(arr, 0.25);
    const q3 = quantile(arr, 0.75);
    return {
      n,
      missingExcluded: values.length - n,
      mean: mean(arr),
      median: median(arr),
      mode: mode(arr),
      sd: sampleSD(arr),
      variance: sampleVariance(arr),
      populationSD: populationSD(arr),
      populationVariance: populationVariance(arr),
      min: min(arr),
      q1,
      q3,
      iqr: Number.isFinite(q1) && Number.isFinite(q3) ? q3 - q1 : NaN,
      max: max(arr),
      range: n ? max(arr) - min(arr) : NaN,
      skewness: skewness(arr),
      kurtosis: kurtosis(arr)
    };
  }

  function skewness(values) {
    const arr = values.filter(Number.isFinite);
    const n = arr.length;
    if (n < 3) return NaN;
    const m = mean(arr);
    const sd = sampleSD(arr);
    if (!Number.isFinite(sd) || Math.abs(sd) < EPS) return NaN;
    const g1 = arr.reduce((acc, v) => acc + Math.pow((v - m) / sd, 3), 0) / n;
    return (Math.sqrt(n * (n - 1)) / (n - 2)) * g1;
  }

  function kurtosis(values) {
    const arr = values.filter(Number.isFinite);
    const n = arr.length;
    if (n < 4) return NaN;
    const m = mean(arr);
    const sd = sampleSD(arr);
    if (!Number.isFinite(sd) || Math.abs(sd) < EPS) return NaN;
    const fourth = arr.reduce((acc, v) => acc + Math.pow((v - m) / sd, 4), 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * fourth - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }

  function frequency(values) {
    const counts = new Map();
    let missing = 0;
    values.forEach(v => {
      if (isMissing(v)) {
        missing += 1;
      } else {
        const key = String(v).trim();
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    const validN = [...counts.values()].reduce((a, b) => a + b, 0);
    const rows = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], undefined, { numeric: true }))
      .map(([value, count]) => ({ value, count, percent: validN ? (count / validN) * 100 : NaN }));
    return { rows, validN, missing, totalN: validN + missing };
  }

  function groupNumeric(rows, groupVar, numericVar) {
    const groups = new Map();
    rows.forEach(r => {
      const g = String(r[groupVar] ?? "").trim();
      const x = toNumber(r[numericVar]);
      if (g && Number.isFinite(x)) {
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(x);
      }
    });
    return groups;
  }

  function independentTTest(rows, groupVar, numericVar, selectedGroups = null, equalVariance = false) {
    const groups = groupNumeric(rows, groupVar, numericVar);
    let keys = [...groups.keys()];
    if (selectedGroups && selectedGroups.length >= 2) keys = selectedGroups.slice(0, 2);
    if (keys.length !== 2) throw new Error("Select exactly two groups for an independent-samples t test.");
    const g1 = keys[0];
    const g2 = keys[1];
    const x1 = groups.get(g1) || [];
    const x2 = groups.get(g2) || [];
    if (x1.length < 2 || x2.length < 2) throw new Error("Each group needs at least two numeric observations.");
    const n1 = x1.length;
    const n2 = x2.length;
    const m1 = mean(x1);
    const m2 = mean(x2);
    const v1 = sampleVariance(x1);
    const v2 = sampleVariance(x2);
    let t, df, se, method;
    if (equalVariance) {
      const sp2 = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2);
      se = Math.sqrt(sp2 * (1 / n1 + 1 / n2));
      df = n1 + n2 - 2;
      method = "Student independent-samples t test (equal variance)";
    } else {
      const a = v1 / n1;
      const b = v2 / n2;
      se = Math.sqrt(a + b);
      df = Math.pow(a + b, 2) / (Math.pow(a, 2) / (n1 - 1) + Math.pow(b, 2) / (n2 - 1));
      method = "Welch independent-samples t test";
    }
    t = Math.abs(se) < EPS ? (Math.abs(m1 - m2) < EPS ? 0 : Math.sign(m1 - m2) * Infinity) : (m1 - m2) / se;
    const p = twoTailedT(t, df);
    const pooledSD = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
    const cohenD = pooledSD > EPS ? (m1 - m2) / pooledSD : NaN;
    const hedgesG = Number.isFinite(cohenD) ? cohenD * (1 - 3 / (4 * (n1 + n2) - 9)) : NaN;
    return {
      method, groupVar, numericVar, group1: g1, group2: g2,
      n1, n2, mean1: m1, mean2: m2, sd1: sampleSD(x1), sd2: sampleSD(x2),
      difference: m1 - m2, se, t, df, p, cohenD, hedgesG,
      assumptions: [
        "The outcome variable is numeric.",
        "The two groups are independent.",
        "For small samples, the outcome is reasonably close to normally distributed within each group.",
        equalVariance ? "Equal variance was assumed." : "Welch's version was used, so equal variances were not required."
      ]
    };
  }

  function pairedTTest(rows, beforeVar, afterVar) {
    const pairs = pairedNumericValues(rows, beforeVar, afterVar);
    if (pairs.length < 2) throw new Error("A paired-samples t test needs at least two complete pairs.");
    const diffs = pairs.map(p => p.y - p.x);
    const n = diffs.length;
    const md = mean(diffs);
    const sd = sampleSD(diffs);
    const se = sd / Math.sqrt(n);
    const t = Math.abs(se) < EPS ? (Math.abs(md) < EPS ? 0 : Math.sign(md) * Infinity) : md / se;
    const df = n - 1;
    const p = twoTailedT(t, df);
    const dz = sd > EPS ? md / sd : NaN;
    return {
      method: "Paired-samples t test",
      beforeVar, afterVar, n,
      beforeMean: mean(pairs.map(p => p.x)),
      afterMean: mean(pairs.map(p => p.y)),
      meanDifference: md,
      sdDifference: sd,
      se, t, df, p, cohenDz: dz,
      assumptions: [
        "The same cases are measured twice or matched in pairs.",
        "The difference scores are numeric.",
        "For small samples, the difference scores are reasonably close to normally distributed."
      ]
    };
  }

  function oneWayANOVA(rows, groupVar, numericVar) {
    const groups = groupNumeric(rows, groupVar, numericVar);
    const keys = [...groups.keys()].filter(k => (groups.get(k) || []).length >= 2);
    if (keys.length < 2) throw new Error("One-way ANOVA needs at least two groups with 2+ numeric observations each.");
    const allValues = keys.flatMap(k => groups.get(k));
    const N = allValues.length;
    const k = keys.length;
    const grandMean = mean(allValues);

    const groupStats = keys.map(key => {
      const vals = groups.get(key);
      return { key, n: vals.length, mean: mean(vals), sd: sampleSD(vals), values: vals };
    });

    const ssBetween = groupStats.reduce((acc, g) => acc + g.n * Math.pow(g.mean - grandMean, 2), 0);
    const ssWithin = groupStats.reduce((acc, g) => acc + g.values.reduce((a, x) => a + Math.pow(x - g.mean, 2), 0), 0);
    const ssTotal = ssBetween + ssWithin;
    const dfBetween = k - 1;
    const dfWithin = N - k;
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;
    const F = msWithin > EPS ? msBetween / msWithin : (msBetween > EPS ? Infinity : NaN);
    const p = Number.isFinite(F) ? Math.max(0, Math.min(1, betai(dfWithin / 2, dfBetween / 2, dfWithin / (dfWithin + dfBetween * F)))) : (F === Infinity ? 0 : NaN);
    const etaSquared = ssTotal > EPS ? ssBetween / ssTotal : NaN;

    // Post-hoc pairwise comparisons using pooled within-group variance (MSwithin),
    // with a Bonferroni correction for the number of pairwise comparisons.
    // This substitutes for Tukey HSD, which requires the studentized range distribution;
    // conclusions are typically similar, but exact p-values will differ from SPSS's Tukey output.
    const comparisons = [];
    const numComparisons = (k * (k - 1)) / 2;
    for (let i = 0; i < groupStats.length; i++) {
      for (let j = i + 1; j < groupStats.length; j++) {
        const gi = groupStats[i], gj = groupStats[j];
        const diff = gi.mean - gj.mean;
        const se = Math.sqrt(msWithin * (1 / gi.n + 1 / gj.n));
        const t = Math.abs(se) < EPS ? (Math.abs(diff) < EPS ? 0 : Math.sign(diff) * Infinity) : diff / se;
        const pRaw = twoTailedT(t, dfWithin);
        const pAdj = Number.isFinite(pRaw) ? Math.max(0, Math.min(1, pRaw * numComparisons)) : pRaw;
        comparisons.push({ groupA: gi.key, groupB: gj.key, meanDifference: diff, se, t, df: dfWithin, pRaw, pBonferroni: pAdj });
      }
    }

    return {
      method: "One-way ANOVA with Bonferroni-corrected pairwise comparisons",
      groupVar, numericVar, k, N,
      groups: groupStats.map(g => ({ key: g.key, n: g.n, mean: g.mean, sd: g.sd })),
      ssBetween, ssWithin, ssTotal, dfBetween, dfWithin,
      msBetween, msWithin, F, p, etaSquared, comparisons,
      assumptions: [
        "The outcome variable is numeric.",
        "Groups are independent of one another.",
        "For small samples, the outcome is reasonably close to normally distributed within each group.",
        "Group variances are approximately equal (homogeneity of variance).",
        "Post-hoc pairwise comparisons use pooled within-group variance with a Bonferroni correction, not Tukey HSD."
      ]
    };
  }

  function pearsonCorrelation(rows, xVar, yVar) {
    const pairs = pairedNumericValues(rows, xVar, yVar);
    const n = pairs.length;
    if (n < 3) throw new Error("Pearson correlation needs at least three complete pairs.");
    const xs = pairs.map(p => p.x);
    const ys = pairs.map(p => p.y);
    const mx = mean(xs);
    const my = mean(ys);
    const sxx = xs.reduce((acc, x) => acc + Math.pow(x - mx, 2), 0);
    const syy = ys.reduce((acc, y) => acc + Math.pow(y - my, 2), 0);
    const sxy = pairs.reduce((acc, p) => acc + (p.x - mx) * (p.y - my), 0);
    const r = sxy / Math.sqrt(sxx * syy);
    const df = n - 2;
    const t = r * Math.sqrt(df / Math.max(EPS, 1 - r * r));
    const p = twoTailedT(t, df);
    return {
      method: "Pearson product-moment correlation",
      xVar, yVar, n, r, rSquared: r * r, t, df, p,
      direction: r > 0 ? "positive" : r < 0 ? "negative" : "no linear",
      strength: correlationStrength(Math.abs(r)),
      assumptions: [
        "Both variables are numeric.",
        "The relationship is approximately linear.",
        "Major outliers should be reviewed because Pearson r is outlier-sensitive."
      ]
    };
  }

  function correlationStrength(absR) {
    if (!Number.isFinite(absR)) return "not available";
    if (absR < 0.10) return "negligible";
    if (absR < 0.30) return "weak";
    if (absR < 0.50) return "moderate";
    if (absR < 0.70) return "strong";
    return "very strong";
  }

  function simpleRegression(rows, xVar, yVar) {
    const pairs = pairedNumericValues(rows, xVar, yVar);
    const n = pairs.length;
    if (n < 3) throw new Error("Simple linear regression needs at least three complete pairs.");
    const xs = pairs.map(p => p.x);
    const ys = pairs.map(p => p.y);
    const mx = mean(xs);
    const my = mean(ys);
    const sxx = xs.reduce((acc, x) => acc + Math.pow(x - mx, 2), 0);
    const syy = ys.reduce((acc, y) => acc + Math.pow(y - my, 2), 0);
    const sxy = pairs.reduce((acc, p) => acc + (p.x - mx) * (p.y - my), 0);
    const slope = sxy / sxx;
    const intercept = my - slope * mx;
    const predicted = xs.map(x => intercept + slope * x);
    const residuals = ys.map((y, i) => y - predicted[i]);
    const sse = residuals.reduce((acc, e) => acc + e * e, 0);
    const ssr = predicted.reduce((acc, yhat) => acc + Math.pow(yhat - my, 2), 0);
    const mse = sse / (n - 2);
    const seSlope = Math.sqrt(mse / sxx);
    const t = slope / seSlope;
    const df = n - 2;
    const p = twoTailedT(t, df);
    const r2 = ssr / syy;
    const r = Math.sign(slope) * Math.sqrt(Math.max(0, r2));
    return {
      method: "Simple linear regression",
      xVar, yVar, n, slope, intercept, r, rSquared: r2,
      sse, ssr, mse, seSlope, t, df, p,
      equation: `${yVar} = ${round(intercept, 4)} + ${round(slope, 4)}(${xVar})`,
      assumptions: [
        "The outcome and predictor are numeric.",
        "The relationship is approximately linear.",
        "Residuals should be reasonably independent and reviewed for unusual outliers.",
        "For formal inference, residuals should be reasonably normally distributed with similar spread across predicted values."
      ]
    };
  }

  function chiSquareFromRows(rows, rowVar, colVar) {
    const rowLevels = [];
    const colLevels = [];
    const rowSet = new Set();
    const colSet = new Set();
    rows.forEach(r => {
      const rv = String(r[rowVar] ?? "").trim();
      const cv = String(r[colVar] ?? "").trim();
      if (rv && cv) {
        if (!rowSet.has(rv)) { rowSet.add(rv); rowLevels.push(rv); }
        if (!colSet.has(cv)) { colSet.add(cv); colLevels.push(cv); }
      }
    });
    const matrix = rowLevels.map(() => colLevels.map(() => 0));
    rows.forEach(r => {
      const rv = String(r[rowVar] ?? "").trim();
      const cv = String(r[colVar] ?? "").trim();
      const i = rowLevels.indexOf(rv);
      const j = colLevels.indexOf(cv);
      if (i >= 0 && j >= 0) matrix[i][j] += 1;
    });
    return chiSquareMatrix(matrix, rowLevels, colLevels, rowVar, colVar);
  }

  function chiSquareMatrix(matrix, rowLevels, colLevels, rowVar = "Rows", colVar = "Columns") {
    const r = matrix.length;
    const c = matrix[0]?.length || 0;
    if (r < 2 || c < 2) throw new Error("Chi-square analysis needs at least a 2 × 2 table.");
    const rowTotals = matrix.map(row => row.reduce((a, b) => a + Number(b || 0), 0));
    const colTotals = Array.from({ length: c }, (_, j) => matrix.reduce((acc, row) => acc + Number(row[j] || 0), 0));
    const total = rowTotals.reduce((a, b) => a + b, 0);
    if (total <= 0) throw new Error("The contingency table has no observations.");
    const expected = matrix.map((row, i) => row.map((_, j) => rowTotals[i] * colTotals[j] / total));
    let chi2 = 0;
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        if (expected[i][j] > 0) chi2 += Math.pow(matrix[i][j] - expected[i][j], 2) / expected[i][j];
      }
    }
    const df = (r - 1) * (c - 1);
    const p = gammq(df / 2, chi2 / 2);
    const minDim = Math.min(r - 1, c - 1);
    const cramersV = minDim > 0 ? Math.sqrt(chi2 / (total * minDim)) : NaN;
    const lowExpected = expected.flat().filter(v => v < 5).length;
    return {
      method: "Chi-square test of independence",
      rowVar, colVar, rowLevels, colLevels, observed: matrix, expected,
      rowTotals, colTotals, total, chi2, df, p, cramersV, lowExpected,
      assumptions: [
        "Variables are categorical.",
        "Each observation contributes to one cell only.",
        "Expected cell counts should generally be at least 5 for standard chi-square inference; use caution if many expected counts are below 5."
      ]
    };
  }

  function confusionMatrixFromRows(rows, actualVar, predictedVar, positiveLabel = "positive") {
    let tp = 0, tn = 0, fp = 0, fn = 0, missing = 0;
    rows.forEach(r => {
      const actual = normalizeLabel(r[actualVar]);
      const pred = normalizeLabel(r[predictedVar]);
      const pos = normalizeLabel(positiveLabel);
      if (!actual || !pred) { missing += 1; return; }
      const actualPositive = actual === pos || ["yes", "true", "1", "positive", "present", "pass", "correct"].includes(actual);
      const predPositive = pred === pos || ["yes", "true", "1", "positive", "present", "flagged", "pass", "correct"].includes(pred);
      if (actualPositive && predPositive) tp += 1;
      else if (!actualPositive && !predPositive) tn += 1;
      else if (!actualPositive && predPositive) fp += 1;
      else if (actualPositive && !predPositive) fn += 1;
    });
    return confusionMetrics(tp, tn, fp, fn, missing);
  }

  function normalizeLabel(v) {
    if (isMissing(v)) return "";
    return String(v).trim().toLowerCase();
  }

  function safeDivide(num, den) {
    return den ? num / den : NaN;
  }

  function confusionMetrics(tp, tn, fp, fn, missing = 0) {
    tp = Number(tp) || 0; tn = Number(tn) || 0; fp = Number(fp) || 0; fn = Number(fn) || 0;
    const total = tp + tn + fp + fn;
    return {
      method: "Confusion matrix metrics",
      tp, tn, fp, fn, total, missing,
      sensitivity: safeDivide(tp, tp + fn),
      specificity: safeDivide(tn, tn + fp),
      ppv: safeDivide(tp, tp + fp),
      npv: safeDivide(tn, tn + fn),
      accuracy: safeDivide(tp + tn, total),
      prevalence: safeDivide(tp + fn, total),
      f1: safeDivide(2 * tp, 2 * tp + fp + fn),
      falsePositiveRate: safeDivide(fp, fp + tn),
      falseNegativeRate: safeDivide(fn, fn + tp)
    };
  }

  function likertSummary(rows, variables) {
    return variables.map(v => {
      const vals = numericValues(rows, v);
      const freqs = frequency(rows.map(r => r[v]));
      return {
        variable: v,
        n: vals.length,
        mean: mean(vals),
        median: median(vals),
        sd: sampleSD(vals),
        min: min(vals),
        max: max(vals),
        frequencies: freqs.rows
      };
    });
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];
      if (ch === '"' && inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        row.push(cell);
        cell = "";
      } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (ch === '\r' && next === '\n') i += 1;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += ch;
      }
    }
    if (cell.length || row.length) {
      row.push(cell);
      rows.push(row);
    }
    const nonEmpty = rows.filter(r => r.some(c => String(c).trim() !== ""));
    if (!nonEmpty.length) return [];
    const headers = nonEmpty[0].map((h, i) => sanitizeHeader(h, i));
    return nonEmpty.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (r[i] ?? "").trim(); });
      return obj;
    });
  }

  function sanitizeHeader(header, index) {
    const base = String(header ?? "").trim() || `variable_${index + 1}`;
    return base.replace(/^\uFEFF/, "");
  }

  function toCSV(rows) {
    if (!rows.length) return "";
    const headers = Object.keys(rows[0]);
    const escape = v => {
      const s = String(v ?? "");
      if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    return [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
  }

  function inferColumns(rows) {
    if (!rows.length) return [];
    const headers = Object.keys(rows[0]);
    return headers.map(name => {
      let nonMissing = 0;
      let numeric = 0;
      const uniques = new Set();
      rows.forEach(r => {
        const raw = r[name];
        if (!isMissing(raw)) {
          nonMissing += 1;
          uniques.add(String(raw).trim());
          if (Number.isFinite(toNumber(raw))) numeric += 1;
        }
      });
      const numericRate = nonMissing ? numeric / nonMissing : 0;
      let type = "categorical";
      if (nonMissing && numericRate >= 0.9) type = "numeric";
      if (nonMissing && uniques.size <= 7 && numericRate < 1) type = "categorical";
      if (nonMissing && numericRate >= 0.9 && uniques.size <= 7) type = "numeric_or_ordinal";
      return { name, type, nonMissing, unique: uniques.size, numericRate };
    });
  }

  function round(value, decimals = 3) {
    if (!Number.isFinite(value)) return NaN;
    const m = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * m) / m;
  }

  function formatNumber(value, decimals = 3) {
    if (!Number.isFinite(value)) return "—";
    return round(value, decimals).toLocaleString(undefined, { maximumFractionDigits: decimals });
  }

  function formatP(value) {
    if (!Number.isFinite(value)) return "—";
    if (value < 0.001) return "< .001";
    return `= ${value.toFixed(3).replace(/^0/, "")}`;
  }

  function significancePhrase(p) {
    if (!Number.isFinite(p)) return "could not be evaluated";
    return p < 0.05 ? "was statistically significant at α = .05" : "was not statistically significant at α = .05";
  }

  function twoTailedT(t, df) {
    if (!Number.isFinite(df) || df <= 0) return NaN;
    if (!Number.isFinite(t)) return Math.abs(t) === Infinity ? 0 : NaN;
    const cdf = studentTCDF(Math.abs(t), df);
    return Math.max(0, Math.min(1, 2 * (1 - cdf)));
  }

  function studentTCDF(t, v) {
    if (!Number.isFinite(t) || !Number.isFinite(v) || v <= 0) return NaN;
    if (t === 0) return 0.5;
    const x = v / (v + t * t);
    const ib = betai(v / 2, 0.5, x);
    return t > 0 ? 1 - 0.5 * ib : 0.5 * ib;
  }

  // Regularized incomplete beta using continued fraction.
  function betai(a, b, x) {
    if (x < 0 || x > 1) return NaN;
    if (x === 0 || x === 1) return x;
    const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }

  function betacf(a, b, x) {
    const MAXIT = 200;
    const FPMIN = 1e-30;
    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let c = 1;
    let d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m;
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 3e-7) break;
    }
    return h;
  }

  // Upper-tail regularized incomplete gamma Q(a, x), used for chi-square p-values.
  function gammq(a, x) {
    if (x < 0 || a <= 0) return NaN;
    if (x === 0) return 1;
    if (x < a + 1) return 1 - gser(a, x);
    return gcf(a, x);
  }

  function gser(a, x) {
    const ITMAX = 200;
    const EPSG = 1e-10;
    let sum = 1 / a;
    let del = sum;
    let ap = a;
    for (let n = 1; n <= ITMAX; n++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * EPSG) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  }

  function gcf(a, x) {
    const ITMAX = 200;
    const EPSG = 1e-10;
    const FPMIN = 1e-30;
    let b = x + 1 - a;
    let c = 1 / FPMIN;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i <= ITMAX; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPSG) break;
    }
    return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
  }

  // Lanczos approximation.
  function logGamma(z) {
    const p = [
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ];
    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    z -= 1;
    let x = 0.99999999999980993;
    for (let i = 0; i < p.length; i++) x += p[i] / (z + i + 1);
    const t = z + p.length - 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }

  function apaT(result) {
    return `${result.method}: t(${formatNumber(result.df, 2)}) = ${formatNumber(result.t, 3)}, p ${formatP(result.p)}.`;
  }

  function apaCorrelation(result) {
    return `Pearson correlation: r(${result.df}) = ${formatNumber(result.r, 3)}, p ${formatP(result.p)}.`;
  }

  function apaRegression(result) {
    return `Simple linear regression indicated that ${result.xVar} explained ${formatNumber(result.rSquared * 100, 1)}% of the variance in ${result.yVar}, R² = ${formatNumber(result.rSquared, 3)}, t(${result.df}) = ${formatNumber(result.t, 3)}, p ${formatP(result.p)}.`;
  }

  function apaChiSquare(result) {
    return `Chi-square test of independence: χ²(${result.df}, N = ${result.total}) = ${formatNumber(result.chi2, 3)}, p ${formatP(result.p)}, Cramer's V = ${formatNumber(result.cramersV, 3)}.`;
  }

  function apaAnova(result) {
    return `One-way ANOVA: F(${result.dfBetween}, ${result.dfWithin}) = ${formatNumber(result.F, 3)}, p ${formatP(result.p)}, η² = ${formatNumber(result.etaSquared, 3)}.`;
  }

  const API = {
    EPS, isMissing, toNumber, numericValues, pairedNumericValues,
    mean, sum, median, quantile, min, max, sampleVariance, populationVariance,
    sampleSD, populationSD, mode, descriptive, skewness, kurtosis, frequency,
    groupNumeric, independentTTest, pairedTTest, pearsonCorrelation, simpleRegression,
    oneWayANOVA,
    chiSquareFromRows, chiSquareMatrix, confusionMatrixFromRows, confusionMetrics,
    likertSummary, parseCSV, toCSV, inferColumns, round, formatNumber, formatP,
    significancePhrase, studentTCDF, twoTailedT, gammq,
    apaT, apaCorrelation, apaRegression, apaChiSquare, apaAnova
  };

  global.RTStats = API;
})(window);
