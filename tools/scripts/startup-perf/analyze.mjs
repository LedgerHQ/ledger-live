#!/usr/bin/env node
// Summarises samples.jsonl written by run.mjs. Launches are paired by (scenario, phase, round);
// the difference is B − A on "App startup time", as read on the Debug screen and with the native
// start added back, estimated with Hodges–Lehmann and a Wilcoxon signed-rank 95% interval. Writes
// a markdown table to stdout and, with --summary, appends it there.
// Exits non-zero when a comparison fails or cannot conclude (see failedRows).
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

// aa-noise and known-regression check the setup; every other preset gates B against A.
const isGate = preset => !["aa-noise", "known-regression"].includes(preset);

// No samples, too few pairs, a slowdown past the threshold, or a known regression not seen.
export function failedRows(rows) {
  return !rows.length || rows.some(r => /^(FAIL|Not detected|Not enough pairs)/.test(r.verdict));
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

// Where the Debug value starts, relative to the first JS import: 0 since develop b3700d9164b
// (2026-10-26, react-native-startup-time removed), ~0.5–1.3 s on emulators before, when it started
// at the library's native mark.
const jsStartOffset = s => s.events?.["Before js imports"]?.time;
// The Debug value from the first JS import, whichever start the build's Debug value uses.
export const fromJsStart = s => s.appStartupTime - (jsStartOffset(s) ?? NaN);
// Wall clock of the first JS import, from the "JS start epoch <ms>" event prepare-build.sh adds.
const jsStartEpoch = s => {
  const name = Object.keys(s.events ?? {}).find(n => /^JS start epoch \d+$/.test(n));
  return name ? Number(name.split(" ").pop()) : NaN;
};
// From the process start: the native start the Debug value leaves out, plus fromJsStart. Needs the
// process start on the app's clock: the host kernel's on iOS (the simulator app shares it), the
// emulator's own on Android. Runs before processStartAppClockAt only have it on iOS.
const appClockProcessStart = s =>
  s.processStartAppClockAt ?? (s.platform === "ios" ? s.processStartAt : NaN);
export const fromProcessStart = s =>
  jsStartEpoch(s) - (appClockProcessStart(s) ?? NaN) + fromJsStart(s);

// B − A of one measure over the pairs of a platform and scenario.
function difference(group, metric) {
  const pairs = pairUp(group, metric);
  const phase = n => hodgesLehmann(pairs.filter(p => p.phase === n).map(p => p.B - p.A))?.estimate;
  const phase0 = phase(0);
  const phase1 = phase(1);
  // Phase 0 puts B on the second device, phase 1 on the first: half their gap is the device effect.
  const instanceBias =
    Number.isFinite(phase0) && Number.isFinite(phase1) ? (phase0 - phase1) / 2 : null;
  // Take the device effect out of each pair before estimating B − A and its interval.
  const adjusted = pairs.map(p => p.B - p.A - (instanceBias ?? 0) * (p.phase === 0 ? 1 : -1));
  // Spread within each half, so the device bias does not inflate it.
  const centred = [0, 1].flatMap(n => {
    const d = pairs.filter(p => p.phase === n).map(p => p.B - p.A);
    const m = median(d);
    return d.map(v => v - m);
  });
  return {
    pairs: pairs.length,
    medianA: median(pairs.map(p => p.A)),
    medianB: median(pairs.map(p => p.B)),
    hl: hodgesLehmann(adjusted),
    spread: robustSd(centred),
    instanceBias,
    mean: bootstrapMean(adjusted),
  };
}

export function summarise(samples, { preset, thresholdMs }) {
  const groups = new Map();
  for (const s of samples) {
    const key = `${s.platform}|${s.scenario}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.entries()].flatMap(([key, group]) => {
    const [platform, scenario] = key.split("|");
    const debugValue = difference(group, s => s.appStartupTime);
    const jsStart = difference(group, fromJsStart);
    const withNative = difference(group, fromProcessStart);
    // Builds on both sides of b3700d9164b: their Debug values start at different points, so the
    // Debug screen row uses the time from the first JS import, which means the same in both.
    const offset = side =>
      median(
        group
          .filter(s => s.ok && !s.warmup && s.side === side)
          .map(jsStartOffset)
          .filter(Number.isFinite),
      );
    const offsetA = offset("A");
    const offsetB = offset("B");
    // The offset is ~0 ms since b3700d9164b and 0.5–1.3 s with the package; its size alone varies
    // with the native start (107 ms between the two LIVE-36190 refs in run 41835997579).
    const countsFromJsStart = offset => offset < 50;
    const startsDiffer =
      Number.isFinite(offsetA) &&
      Number.isFinite(offsetB) &&
      countsFromJsStart(offsetA) !== countsFromJsStart(offsetB);
    const screen = startsDiffer && jsStart.pairs ? jsStart : debugValue;
    const measured = group.filter(s => !s.warmup);
    const row = (measure, d, verdict) => ({
      platform,
      scenario,
      measure,
      startsDiffer,
      ...d,
      failed: measured.filter(s => !s.ok).length,
      launches: measured.length,
      detectable: detectableAt80(d.hl, thresholdMs),
      verdict: verdict ?? verdictFor(preset, d.hl, thresholdMs),
    });
    // Only a build too old for the "JS start epoch" event goes without the native verdict; launches
    // that lack a process start count as missing pairs, so a harness fault still shows.
    const withoutEpoch = ["A", "B"].filter(
      side =>
        !group.some(s => s.ok && !s.warmup && s.side === side && Number.isFinite(jsStartEpoch(s))),
    );
    const nativeMissing = withoutEpoch.length > 0 && screen.pairs > 0;
    return [
      row(screen === jsStart ? "Debug screen, from JS start" : "Debug screen", screen),
      row(
        "With native start",
        withNative,
        nativeMissing
          ? `Not measured: ${withoutEpoch.length > 1 ? "builds A and B have" : `build ${withoutEpoch[0]} has`} no "JS start epoch" event`
          : undefined,
      ),
    ];
  });
}

const fmt = v =>
  v === null || v === undefined || !Number.isFinite(v) ? "–" : String(Math.round(v));
const signed = v => (Number.isFinite(v) ? `${v > 0 ? "+" : ""}${Math.round(v)}` : "–");

export function toMarkdown(rows, { preset, labelA, labelB, thresholdMs }) {
  const lines = [
    `### Startup time, ${preset}: B − A`,
    "",
    `A = ${labelA} · B = ${labelB}.`,
    isGate(preset)
      ? `B fails when it is slower than A by more than ${thresholdMs} ms on either measure.`
      : "",
    "",
    "| Platform | Scenario | Measure | Pairs | Median A (ms) | Median B (ms) | B − A (ms) | 95% interval (ms) | Mean B − A (ms) | Flags a slowdown of (ms) | Spread of B − A (ms) | Device bias (ms) | Failed launches | Verdict |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of rows) {
    const interval =
      r.hl?.low === null || !r.hl ? "–" : `${signed(r.hl.low)} to ${signed(r.hl.high)}`;
    const mean = r.mean
      ? `${signed(r.mean.estimate)} (${signed(r.mean.low)} to ${signed(r.mean.high)})`
      : "–";
    lines.push(
      `| ${r.platform} | ${r.scenario} | ${r.measure} | ${r.pairs} | ${fmt(r.medianA)} | ${fmt(r.medianB)} | ${signed(r.hl?.estimate)} | ${interval} | ${mean} | ${fmt(r.detectable)} | ${fmt(r.spread)} | ${signed(r.instanceBias)} | ${r.failed}/${r.launches} | ${r.verdict} |`,
    );
  }
  lines.push(
    "",
    "- **Debug screen**: Settings > Debug > Performance > App startup time, which counts from the first JS import since 4.26 (b3700d9164b).",
    "- **With native start**: the same end, counted from the start of the app process (the emulator's or the host's kernel), so the native start up to the first JS import (\"JS start epoch\" event) is in again. On iOS this row equals the Debug value of the builds that had react-native-startup-time (within 3 ms). On Android it is about 350–400 ms higher than theirs, because that package started its clock later, when the React host was created.",
    "",
    "B − A is the Hodges–Lehmann median of the paired differences, after removing the device bias: how much slower the second emulator or simulator is than the first, measured thanks to the halfway swap.",
    `The mean (with a bootstrap 95% interval) is what the manual test compares. "Flags a slowdown of" is the true B − A the ${thresholdMs} ms gate catches 80% of the time at this noise; a true ${thresholdMs} ms is caught half the time.`,
    ...rows
      .filter(r => r.startsDiffer && r.measure.startsWith("Debug screen"))
      .map(
        r =>
          `**${r.platform} ${r.scenario}: A's and B's Debug values start at different points (develop changed it on 2026-10-26, b3700d9164b), so the Debug screen row compares the time from the first JS import.**`,
      ),
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
  if (values.json) {
    await mkdir(path.dirname(values.json), { recursive: true });
    await writeFile(values.json, JSON.stringify(rows, null, 2));
  }
  if (failedRows(rows)) {
    console.error(
      "::error::The startup check failed or could not conclude: see the verdicts above",
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
