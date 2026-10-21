#!/usr/bin/env node
// Summarises samples.jsonl written by run.mjs. Launches are paired by (scenario, phase, round);
// the difference is B − A on "App startup time", estimated with Hodges–Lehmann and a Wilcoxon
// signed-rank 95% interval. Writes a markdown table to stdout and, with --summary, appends it there.
import { appendFile, readFile, writeFile } from "node:fs/promises";
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
    if (!s.ok || s.warmup) continue;
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
  if (hl.estimate > thresholdMs) return `FAIL: B is slower by more than ${thresholdMs} ms`;
  return hl.high <= thresholdMs ? "PASS" : "PASS (interval reaches the threshold)";
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
      launches: measured.length,
      medianA: median(pairs.map(p => p.A)),
      medianB: median(pairs.map(p => p.B)),
      hl,
      spread: robustSd(centred),
      instanceBias,
      amStart,
      verdict: verdictFor(preset, hl, thresholdMs),
    };
  });
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
    "| Platform | Scenario | Pairs | Median A (ms) | Median B (ms) | B − A (ms) | 95% interval (ms) | Spread of B − A (ms) | Device bias (ms) | `am start` B − A (ms) | Failed launches | Verdict |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of rows) {
    const interval =
      r.hl?.low === null || !r.hl ? "–" : `${signed(r.hl.low)} to ${signed(r.hl.high)}`;
    lines.push(
      `| ${r.platform} | ${r.scenario} | ${r.pairs} | ${fmt(r.medianA)} | ${fmt(r.medianB)} | ${signed(r.hl?.estimate)} | ${interval} | ${fmt(r.spread)} | ${signed(r.instanceBias)} | ${r.platform === "android" ? signed(r.amStart?.estimate) : "–"} | ${r.failed}/${r.launches} | ${r.verdict} |`,
    );
  }
  lines.push(
    "",
    "B − A is the Hodges–Lehmann median of the paired differences, after removing the device bias: how much slower the second emulator or simulator is than the first, measured thanks to the halfway swap.",
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
  const markdown = rows.length
    ? toMarkdown(rows, options)
    : "### Startup time\n\nNo samples were recorded.\n";
  console.log(markdown);
  if (values.summary) await appendFile(values.summary, markdown + "\n");
  if (values.json) await writeFile(values.json, JSON.stringify(rows, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
