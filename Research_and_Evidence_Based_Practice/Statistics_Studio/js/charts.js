/* RTApps Statistics Studio - charts.js
   SVG charts for small educational datasets. */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s ?? "").replace(/[&<>'"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[ch]));
  }

  function svgShell(width, height, inner) {
    return `<svg viewBox="0 0 ${width} ${height}" role="img" xmlns="http://www.w3.org/2000/svg" aria-label="chart">${inner}</svg>`;
  }

  function axisLabels(opts) {
    const { width, height, margin, xLabel = "", yLabel = "" } = opts;
    return `
      <text x="${width / 2}" y="${height - 8}" text-anchor="middle" font-size="12" fill="#334155">${esc(xLabel)}</text>
      <text x="14" y="${height / 2}" text-anchor="middle" font-size="12" fill="#334155" transform="rotate(-90 14 ${height / 2})">${esc(yLabel)}</text>
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#64748b" stroke-width="1" />
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#64748b" stroke-width="1" />
    `;
  }

  function niceTicks(min, max, count = 5) {
    if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [min || 0];
    const span = max - min;
    const step0 = span / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const err = step0 / mag;
    const step = err >= 7.5 ? 10 * mag : err >= 3.5 ? 5 * mag : err >= 1.5 ? 2 * mag : mag;
    const start = Math.ceil(min / step) * step;
    const ticks = [];
    for (let v = start; v <= max + step * 0.5; v += step) ticks.push(Number(v.toPrecision(12)));
    return ticks;
  }

  function histogram(values, options = {}) {
    const arr = values.filter(Number.isFinite);
    if (!arr.length) return empty("No numeric values available for a histogram.");
    const width = 760, height = 320;
    const margin = { top: 34, right: 24, bottom: 54, left: 54 };
    const min = Math.min(...arr), max = Math.max(...arr);
    const bins = options.bins || Math.max(4, Math.ceil(Math.sqrt(arr.length)));
    const span = max - min || 1;
    const binWidth = span / bins;
    const counts = Array.from({ length: bins }, () => 0);
    arr.forEach(v => {
      let idx = Math.floor((v - min) / binWidth);
      if (idx >= bins) idx = bins - 1;
      if (idx < 0) idx = 0;
      counts[idx]++;
    });
    const yMax = Math.max(...counts, 1);
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const x = i => margin.left + i * plotW / bins;
    const y = c => height - margin.bottom - c / yMax * plotH;
    const bars = counts.map((c, i) => {
      const bx = x(i) + 2;
      const by = y(c);
      const bw = plotW / bins - 4;
      const bh = height - margin.bottom - by;
      return `<rect x="${bx}" y="${by}" width="${Math.max(1, bw)}" height="${bh}" rx="4" fill="#2563eb"><title>${esc((min + i * binWidth).toFixed(2))} to ${esc((min + (i + 1) * binWidth).toFixed(2))}: ${c}</title></rect>`;
    }).join("");
    const ticks = niceTicks(min, max, 6).map(t => {
      const tx = margin.left + (t - min) / span * plotW;
      return `<line x1="${tx}" y1="${height - margin.bottom}" x2="${tx}" y2="${height - margin.bottom + 5}" stroke="#64748b"/><text x="${tx}" y="${height - margin.bottom + 20}" text-anchor="middle" font-size="10" fill="#475569">${Number(t.toFixed(2))}</text>`;
    }).join("");
    const yTicks = niceTicks(0, yMax, 4).map(t => {
      const ty = y(t);
      return `<line x1="${margin.left - 5}" y1="${ty}" x2="${margin.left}" y2="${ty}" stroke="#64748b"/><line x1="${margin.left}" y1="${ty}" x2="${width - margin.right}" y2="${ty}" stroke="#e5e7eb"/><text x="${margin.left - 8}" y="${ty + 4}" text-anchor="end" font-size="10" fill="#475569">${t}</text>`;
    }).join("");
    return svgShell(width, height, `<rect width="100%" height="100%" fill="white"/>${axisLabels({ width, height, margin, xLabel: options.xLabel || "Value", yLabel: "Frequency" })}${yTicks}${bars}${ticks}<text x="${margin.left}" y="22" font-size="14" font-weight="700" fill="#0f172a">${esc(options.title || "Histogram")}</text>`);
  }

  function barChart(freqRows, options = {}) {
    const rows = (freqRows || []).slice(0, options.maxBars || 18);
    if (!rows.length) return empty("No categories available for a bar chart.");
    const width = 780, height = Math.max(320, 105 + rows.length * 28);
    const margin = { top: 36, right: 32, bottom: 42, left: 180 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const maxCount = Math.max(...rows.map(r => r.count), 1);
    const rowH = plotH / rows.length;
    const bars = rows.map((r, i) => {
      const y = margin.top + i * rowH + 4;
      const w = r.count / maxCount * plotW;
      return `
        <text x="${margin.left - 10}" y="${y + rowH / 2 + 4}" text-anchor="end" font-size="11" fill="#334155">${esc(shorten(r.value, 26))}</text>
        <rect x="${margin.left}" y="${y}" width="${w}" height="${Math.max(10, rowH - 8)}" rx="5" fill="#0ea5e9"><title>${esc(r.value)}: ${r.count}</title></rect>
        <text x="${margin.left + w + 6}" y="${y + rowH / 2 + 4}" font-size="11" fill="#334155">${r.count}</text>`;
    }).join("");
    const xTicks = niceTicks(0, maxCount, 5).map(t => {
      const x = margin.left + t / maxCount * plotW;
      return `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${height - margin.bottom}" stroke="#e5e7eb"/><text x="${x}" y="${height - margin.bottom + 17}" text-anchor="middle" font-size="10" fill="#475569">${t}</text>`;
    }).join("");
    return svgShell(width, height, `<rect width="100%" height="100%" fill="white"/><text x="${margin.left}" y="22" font-size="14" font-weight="700" fill="#0f172a">${esc(options.title || "Frequency Bar Chart")}</text><line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#64748b"/>${xTicks}${bars}<text x="${width/2}" y="${height - 8}" text-anchor="middle" font-size="12" fill="#334155">Count</text>`);
  }

  function boxPlot(values, options = {}) {
    const arr = values.filter(Number.isFinite).sort((a,b)=>a-b);
    if (arr.length < 2) return empty("At least two numeric values are needed for a box plot.");
    const width = 760, height = 230;
    const margin = { top: 36, right: 34, bottom: 52, left: 42 };
    const minV = arr[0], maxV = arr[arr.length-1];
    const q1 = global.RTStats.quantile(arr, .25);
    const med = global.RTStats.quantile(arr, .5);
    const q3 = global.RTStats.quantile(arr, .75);
    const span = maxV - minV || 1;
    const x = v => margin.left + (v - minV) / span * (width - margin.left - margin.right);
    const midY = height / 2;
    const boxY = midY - 32;
    const ticks = niceTicks(minV, maxV, 6).map(t => {
      const tx = x(t);
      return `<line x1="${tx}" y1="${midY + 45}" x2="${tx}" y2="${midY + 50}" stroke="#64748b"/><text x="${tx}" y="${midY + 66}" text-anchor="middle" font-size="10" fill="#475569">${Number(t.toFixed(2))}</text>`;
    }).join("");
    const inner = `
      <rect width="100%" height="100%" fill="white"/>
      <text x="${margin.left}" y="22" font-size="14" font-weight="700" fill="#0f172a">${esc(options.title || "Box Plot")}</text>
      <line x1="${x(minV)}" y1="${midY}" x2="${x(maxV)}" y2="${midY}" stroke="#334155" stroke-width="2"/>
      <line x1="${x(minV)}" y1="${midY-18}" x2="${x(minV)}" y2="${midY+18}" stroke="#334155" stroke-width="2"/>
      <line x1="${x(maxV)}" y1="${midY-18}" x2="${x(maxV)}" y2="${midY+18}" stroke="#334155" stroke-width="2"/>
      <rect x="${x(q1)}" y="${boxY}" width="${Math.max(1, x(q3)-x(q1))}" height="64" rx="7" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
      <line x1="${x(med)}" y1="${boxY}" x2="${x(med)}" y2="${boxY + 64}" stroke="#1d4ed8" stroke-width="3"/>
      <line x1="${margin.left}" y1="${midY + 45}" x2="${width - margin.right}" y2="${midY + 45}" stroke="#64748b"/>
      ${ticks}
      <text x="${x(minV)}" y="${midY-26}" text-anchor="middle" font-size="10" fill="#475569">Min ${fmt(minV)}</text>
      <text x="${x(maxV)}" y="${midY-26}" text-anchor="middle" font-size="10" fill="#475569">Max ${fmt(maxV)}</text>
    `;
    return svgShell(width, height, inner);
  }

  function scatterPlot(pairs, options = {}) {
    const clean = pairs.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
    if (clean.length < 2) return empty("At least two complete numeric pairs are needed for a scatterplot.");
    const width = 760, height = 430;
    const margin = { top: 38, right: 32, bottom: 62, left: 64 };
    let minX = Math.min(...clean.map(p => p.x));
    let maxX = Math.max(...clean.map(p => p.x));
    let minY = Math.min(...clean.map(p => p.y));
    let maxY = Math.max(...clean.map(p => p.y));
    if (minX === maxX) { minX -= 1; maxX += 1; }
    if (minY === maxY) { minY -= 1; maxY += 1; }
    const padX = (maxX - minX) * .05;
    const padY = (maxY - minY) * .05;
    minX -= padX; maxX += padX; minY -= padY; maxY += padY;
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const x = v => margin.left + (v - minX) / (maxX - minX) * plotW;
    const y = v => height - margin.bottom - (v - minY) / (maxY - minY) * plotH;
    const xTicks = niceTicks(minX, maxX, 6).map(t => {
      const tx = x(t);
      return `<line x1="${tx}" y1="${margin.top}" x2="${tx}" y2="${height-margin.bottom}" stroke="#e5e7eb"/><text x="${tx}" y="${height-margin.bottom+18}" text-anchor="middle" font-size="10" fill="#475569">${fmt(t)}</text>`;
    }).join("");
    const yTicks = niceTicks(minY, maxY, 6).map(t => {
      const ty = y(t);
      return `<line x1="${margin.left}" y1="${ty}" x2="${width-margin.right}" y2="${ty}" stroke="#e5e7eb"/><text x="${margin.left-8}" y="${ty+4}" text-anchor="end" font-size="10" fill="#475569">${fmt(t)}</text>`;
    }).join("");
    const pts = clean.map(p => `<circle cx="${x(p.x)}" cy="${y(p.y)}" r="4" fill="#2563eb" opacity="0.78"><title>x=${fmt(p.x)}, y=${fmt(p.y)}</title></circle>`).join("");
    let line = "";
    if (options.regression && Number.isFinite(options.regression.slope) && Number.isFinite(options.regression.intercept)) {
      const y1 = options.regression.intercept + options.regression.slope * minX;
      const y2 = options.regression.intercept + options.regression.slope * maxX;
      line = `<line x1="${x(minX)}" y1="${y(y1)}" x2="${x(maxX)}" y2="${y(y2)}" stroke="#b91c1c" stroke-width="2.5" stroke-dasharray="5 4"/>`;
    }
    return svgShell(width, height, `
      <rect width="100%" height="100%" fill="white"/>
      <text x="${margin.left}" y="24" font-size="14" font-weight="700" fill="#0f172a">${esc(options.title || "Scatterplot")}</text>
      ${axisLabels({ width, height, margin, xLabel: options.xLabel || "X", yLabel: options.yLabel || "Y" })}
      ${xTicks}${yTicks}${line}${pts}`);
  }

  function confusionChart(metrics, options = {}) {
    const width = 560, height = 360;
    const values = [metrics.tp, metrics.fp, metrics.fn, metrics.tn];
    const max = Math.max(...values, 1);
    const x0 = 110, y0 = 70, cellW = 175, cellH = 105;
    function cell(x, y, label, value, subtitle) {
      const opacity = .18 + .62 * (value / max);
      return `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="12" fill="#2563eb" opacity="${opacity}" stroke="#1d4ed8"/>
        <text x="${x+cellW/2}" y="${y+34}" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">${esc(label)}</text>
        <text x="${x+cellW/2}" y="${y+63}" text-anchor="middle" font-size="28" font-weight="800" fill="#0f172a">${value}</text>
        <text x="${x+cellW/2}" y="${y+88}" text-anchor="middle" font-size="11" fill="#334155">${esc(subtitle)}</text>`;
    }
    const inner = `
      <rect width="100%" height="100%" fill="white"/>
      <text x="${x0}" y="28" font-size="14" font-weight="700" fill="#0f172a">${esc(options.title || "Confusion Matrix")}</text>
      <text x="${x0 + cellW}" y="54" text-anchor="middle" font-size="12" fill="#334155">Predicted / Response</text>
      <text x="40" y="${y0 + cellH}" text-anchor="middle" font-size="12" fill="#334155" transform="rotate(-90 40 ${y0 + cellH})">Actual Status</text>
      <text x="${x0+cellW/2}" y="${y0-12}" text-anchor="middle" font-size="12" font-weight="700" fill="#334155">Positive</text>
      <text x="${x0+cellW+24+cellW/2}" y="${y0-12}" text-anchor="middle" font-size="12" font-weight="700" fill="#334155">Negative</text>
      <text x="${x0-15}" y="${y0+cellH/2}" text-anchor="end" font-size="12" font-weight="700" fill="#334155">Positive</text>
      <text x="${x0-15}" y="${y0+cellH+24+cellH/2}" text-anchor="end" font-size="12" font-weight="700" fill="#334155">Negative</text>
      ${cell(x0, y0, "True Positive", metrics.tp, "actual + / response +")}
      ${cell(x0 + cellW + 24, y0, "False Negative", metrics.fn, "actual + / response -")}
      ${cell(x0, y0 + cellH + 24, "False Positive", metrics.fp, "actual - / response +")}
      ${cell(x0 + cellW + 24, y0 + cellH + 24, "True Negative", metrics.tn, "actual - / response -")}
    `;
    return svgShell(width, height, inner);
  }

  function empty(message) {
    return `<div class="help-text">${esc(message)}</div>`;
  }

  function shorten(s, max) {
    s = String(s ?? "");
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  }

  function fmt(v) {
    if (!Number.isFinite(v)) return "—";
    const abs = Math.abs(v);
    if (abs >= 100) return v.toFixed(0);
    if (abs >= 10) return v.toFixed(1);
    return v.toFixed(2);
  }

  global.RTCharts = { histogram, barChart, boxPlot, scatterPlot, confusionChart, empty };
})(window);
