#!/usr/bin/env node
// Summarises samples.jsonl written by run.mjs. Launches are paired by (scenario, phase, round);
// the difference is B − A on "App startup time", estimated with Hodges–Lehmann and a Wilcoxon
// signed-rank 95% interval. Writes a markdown table to stdout and, with --summary, appends it there,
// followed by how the CPU load recorded around each launch relates to its startup time.
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const Z_95 = 1.959964;

export function median(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Robust standard deviation: median absolute deviation scaled to a normal SD.
export function robustSd(values) {
  const m = median(values);
  if (m === null) return null;
  return 1.4826 * median(values.map(v => Math.abs(v - m)));
}

// Hodges–Lehmann estimate of the median difference, with the normal-approximation
// Wilcoxon interval (Hollander & Wolfe): bounds are the C-th smallest and largest Walsh averages.
export function hodgesLehmann(diffs) {
  const n = diffs.length;
  if (!n) return null;
  const walsh = [];
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) walsh.push((diffs[i] + diffs[j]) / 2);
  walsh.sort((a, b) => a - b);
  const estimate = median(walsh);
  if (n < 6) return { estimate, low: null, high: null };
  const k = (n * (n + 1)) / 4 - Z_95 * Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24);
  const c = Math.max(1, Math.floor(k + 0.5));
  return { estimate, low: walsh[c - 1], high: walsh[walsh.length - c] };
}

export function pairUp(samples, metric) {
  const byKey = new Map();
  for (const s of samples) {
    // Traced launches carry the tracer's load.
    if (!s.ok || s.warmup || s.traced) continue;
    const value = metric(s);
    if (!Number.isFinite(value)) continue;
    const key = `${s.platform}|${s.scenario}|${s.phase}|${s.round}`;
    const entry = byKey.get(key) ?? { platform: s.platform, scenario: s.scenario, phase: s.phase };
    entry[s.side] = value;
    byKey.set(key, entry);
  }
  return [...byKey.values()].filter(p => Number.isFinite(p.A) && Number.isFinite(p.B));
}

function verdictFor(preset, hl, thresholdMs) {
  if (!hl || hl.low === null) return "Not enough pairs";
  const ci = `[${Math.round(hl.low)}, ${Math.round(hl.high)}]`;
  if (preset === "aa-noise") {
    const halfWidth = Math.round((hl.high - hl.low) / 2);
    const centred = hl.low <= 0 && hl.high >= 0;
    return `${centred ? "OK" : "Biased"}: resolves about ±${halfWidth} ms`;
  }
  if (preset === "known-regression") {
    // B is the fix, so a visible regression means B − A is clearly below zero.
    return hl.high < 0
      ? `Detected: the fix is ${Math.round(-hl.estimate)} ms faster`
      : `Not detected ${ci}`;
  }
  // The gate is on the estimate; when the interval holds the threshold, more pairs could flip it.
  const inconclusive =
    hl.low <= thresholdMs && hl.high >= thresholdMs
      ? ` (inconclusive: ${ci} contains ${thresholdMs} ms)`
      : "";
  if (hl.estimate > thresholdMs) {
    return `FAIL: B is slower by more than ${thresholdMs} ms${inconclusive}`;
  }
  return `PASS${inconclusive}`;
}

// The true slowdown the gate flags 80% of the time: the estimate exceeds the threshold when the
// true B − A is the threshold plus 0.84 standard errors, the error read off the 95% interval
// (normal approximation).
export function detectableAt80(hl, thresholdMs) {
  if (!hl || hl.low === null) return null;
  return thresholdMs + 0.8416 * ((hl.high - hl.low) / (2 * Z_95));
}

// Mean of the differences with a percentile bootstrap 95% interval, the mean being what the manual
// test compares. Seeded, so the same samples always give the same interval.
export function bootstrapMean(diffs, resamples = 4000) {
  const n = diffs.length;
  if (n < 6) return null;
  let seed = 0x9e3779b9;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const mean = values => values.reduce((a, v) => a + v, 0) / values.length;
  const means = [];
  for (let r = 0; r < resamples; r++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += diffs[Math.floor(random() * n)];
    means.push(sum / n);
  }
  means.sort((a, b) => a - b);
  return {
    estimate: mean(diffs),
    low: means[Math.floor(0.025 * resamples)],
    high: means[Math.ceil(0.975 * resamples) - 1],
  };
}

export function summarise(samples, { preset, thresholdMs }) {
  const groups = new Map();
  for (const s of samples) {
    const key = `${s.platform}|${s.scenario}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.entries()].map(([key, group]) => {
    const [platform, scenario] = key.split("|");
    const pairs = pairUp(group, s => s.appStartupTime);
    const phase = n =>
      hodgesLehmann(pairs.filter(p => p.phase === n).map(p => p.B - p.A))?.estimate;
    const phase0 = phase(0);
    const phase1 = phase(1);
    // Phase 0 puts B on the second device, phase 1 on the first: half their gap is the device effect.
    const instanceBias =
      Number.isFinite(phase0) && Number.isFinite(phase1) ? (phase0 - phase1) / 2 : null;
    // Take the device effect out of each pair before estimating B − A and its interval.
    const adjusted = pairs.map(p => p.B - p.A - (instanceBias ?? 0) * (p.phase === 0 ? 1 : -1));
    const hl = hodgesLehmann(adjusted);
    // Spread within each half, so the device bias does not inflate it.
    const centred = [0, 1].flatMap(n => {
      const d = pairs.filter(p => p.phase === n).map(p => p.B - p.A);
      const m = median(d);
      return d.map(v => v - m);
    });
    const amStart = hodgesLehmann(
      pairUp(group, s => s.amStart?.totalTime ?? NaN).map(p => p.B - p.A),
    );
    const measured = group.filter(s => !s.warmup);
    return {
      platform,
      scenario,
      pairs: pairs.length,
      failed: measured.filter(s => !s.ok).length,
      traced: measured.filter(s => s.traced).length,
      launches: measured.length,
      medianA: median(pairs.map(p => p.A)),
      medianB: median(pairs.map(p => p.B)),
      hl,
      spread: robustSd(centred),
      instanceBias,
      amStart,
      mean: bootstrapMean(adjusted),
      detectable: detectableAt80(hl, thresholdMs),
      verdict: verdictFor(preset, hl, thresholdMs),
    };
  });
}

function ranks(values) {
  const order = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const result = new Array(values.length);
  for (let i = 0; i < order.length;) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    for (let k = i; k <= j; k++) result[order[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return result;
}

// Spearman rank correlation: Pearson on the ranks, ties averaged.
export function spearman(x, y) {
  const rx = ranks(x);
  const ry = ranks(y);
  const mean = v => v.reduce((a, b) => a + b, 0) / v.length;
  const mx = mean(rx);
  const my = mean(ry);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < rx.length; i++) {
    sxy += (rx[i] - mx) * (ry[i] - my);
    sxx += (rx[i] - mx) ** 2;
    syy += (ry[i] - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

const LOAD_MEASURES = [
  ["Runner CPU busy, 5 s before launch (%)", s => s.load?.beforeLaunch?.hostBusyPct],
  ["Runner CPU busy, during launch (%)", s => s.load?.duringLaunch?.hostBusyPct],
  ["Runner CPU throttled, during launch (ms)", s => s.load?.duringLaunch?.throttledMs],
  ["Device CPU busy, 5 s before launch (%)", s => s.load?.beforeLaunch?.deviceBusyPct],
  ["Device load average, before launch", s => s.load?.beforeLaunch?.deviceLoadavg1],
  ["Device CPU steal, during launch (%)", s => s.load?.duringLaunch?.deviceStealPct],
];

// How the load recorded by run.mjs around each launch relates to its startup time. The startup
// time is taken relative to the median of its device, side and half, so neither the device bias
// nor B − A shows up as a correlation.
export function loadSummary(samples) {
  const groups = new Map();
  for (const s of samples) {
    if (!s.ok || s.warmup || s.traced || !s.load || !Number.isFinite(s.appStartupTime)) continue;
    const key = `${s.platform}|${s.scenario}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.entries()].map(([key, group]) => {
    const [platform, scenario] = key.split("|");
    const cell = s => `${s.device}|${s.side}|${s.phase}`;
    const cellMedian = new Map();
    for (const c of new Set(group.map(cell))) {
      cellMedian.set(c, median(group.filter(s => cell(s) === c).map(s => s.appStartupTime)));
    }
    const residual = s => s.appStartupTime - cellMedian.get(cell(s));
    const measures = [];
    for (const [label, get] of LOAD_MEASURES) {
      const points = group.filter(s => Number.isFinite(get(s)));
      if (points.length < 6) continue;
      const rho = spearman(points.map(residual), points.map(get));
      measures.push({
        label,
        n: points.length,
        median: median(points.map(get)),
        rho,
        // Two-sided 5% critical value of Spearman's rho, normal approximation.
        related: rho !== null && Math.abs(rho) > Z_95 / Math.sqrt(points.length - 1),
      });
    }
    return {
      platform,
      scenario,
      launches: group.length,
      otherPaused: group.filter(s => s.load.otherPaused).length,
      measures,
    };
  });
}

export function loadToMarkdown(rows) {
  const lines = [
    "### Load around the launches",
    "",
    "Correlation (Spearman) between each measure and the startup time, taken relative to its own device, side and half. Marked ⚠ when it is unlikely to be chance (5% level): that load explains part of the spread.",
    "",
    "| Platform | Scenario | Other emulator paused | Measure | Median | Correlation with startup time |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of rows) {
    for (const m of r.measures) {
      const value = Number.isInteger(m.median) ? m.median : m.median.toFixed(1);
      const rho = m.rho === null ? "–" : `${m.rho.toFixed(2)}${m.related ? " ⚠" : ""}`;
      lines.push(
        `| ${r.platform} | ${r.scenario} | ${r.otherPaused}/${r.launches} | ${m.label} | ${value} | ${rho} |`,
      );
    }
  }
  return lines.join("\n") + "\n";
}

const fmt = v =>
  v === null || v === undefined || !Number.isFinite(v) ? "–" : String(Math.round(v));
const signed = v => (Number.isFinite(v) ? `${v > 0 ? "+" : ""}${Math.round(v)}` : "–");

export function toMarkdown(rows, { preset, labelA, labelB, thresholdMs }) {
  const lines = [
    `### Startup time, ${preset}: B − A`,
    "",
    `A = ${labelA} · B = ${labelB}. Value read from Settings > Debug > Performance > App startup time.`,
    preset === "custom" ? `B fails when it is slower than A by more than ${thresholdMs} ms.` : "",
    "",
    "| Platform | Scenario | Pairs | Median A (ms) | Median B (ms) | B − A (ms) | 95% interval (ms) | Mean B − A (ms) | Flags a slowdown of (ms) | Spread of B − A (ms) | Device bias (ms) | `am start` B − A (ms) | Failed launches | Verdict |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of rows) {
    const interval =
      r.hl?.low === null || !r.hl ? "–" : `${signed(r.hl.low)} to ${signed(r.hl.high)}`;
    const mean = r.mean
      ? `${signed(r.mean.estimate)} (${signed(r.mean.low)} to ${signed(r.mean.high)})`
      : "–";
    lines.push(
      `| ${r.platform} | ${r.scenario} | ${r.pairs} | ${fmt(r.medianA)} | ${fmt(r.medianB)} | ${signed(r.hl?.estimate)} | ${interval} | ${mean} | ${fmt(r.detectable)} | ${fmt(r.spread)} | ${signed(r.instanceBias)} | ${r.platform === "android" ? signed(r.amStart?.estimate) : "–"} | ${r.failed}/${r.launches} | ${r.verdict} |`,
    );
  }
  lines.push(
    "",
    "B − A is the Hodges–Lehmann median of the paired differences, after removing the device bias: how much slower the second emulator or simulator is than the first, measured thanks to the halfway swap.",
    ...rows
      .filter(r => r.traced)
      .map(
        r =>
          `${r.platform} ${r.scenario}: ${r.traced} traced launches left out (the tracer adds load).`,
      ),
    `The mean (with a bootstrap 95% interval) is what the manual test compares. "Flags a slowdown of" is the true B − A the ${thresholdMs} ms gate catches 80% of the time at this noise; a true ${thresholdMs} ms is caught half the time.`,
    "",
  );
  return lines.filter((l, i) => l !== "" || lines[i - 1] !== "").join("\n");
}

async function main() {
  const { values } = parseArgs({
    options: {
      samples: { type: "string", multiple: true },
      preset: { type: "string", default: "custom" },
      "threshold-ms": { type: "string", default: "100" },
      "label-a": { type: "string", default: "A" },
      "label-b": { type: "string", default: "B" },
      summary: { type: "string" },
      json: { type: "string" },
    },
  });
  const samples = [];
  for (const file of values.samples ?? []) {
    const text = await readFile(file, "utf8").catch(() => "");
    for (const line of text.split("\n")) if (line.trim()) samples.push(JSON.parse(line));
  }
  const options = {
    preset: values.preset,
    thresholdMs: Number(values["threshold-ms"]),
    labelA: values["label-a"],
    labelB: values["label-b"],
  };
  const rows = summarise(samples, options);
  const loadRows = loadSummary(samples).filter(r => r.measures.length);
  const markdown =
    (rows.length ? toMarkdown(rows, options) : "### Startup time\n\nNo samples were recorded.\n") +
    (loadRows.length ? "\n" + loadToMarkdown(loadRows) : "");
  console.log(markdown);
  if (values.summary) await appendFile(values.summary, markdown + "\n");
  if (values.json) {
    await mkdir(path.dirname(values.json), { recursive: true });
    await writeFile(values.json, JSON.stringify(rows, null, 2));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
