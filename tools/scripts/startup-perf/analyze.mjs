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

// The first JS import, relative to where the build's Debug value starts: ~0 when it counts from the
// JS start (4.26, b3700d9164b), the native start otherwise (react-native-startup-time before 4.26,
// the app's process start from LIVE-40286 on).
const jsStartOffset = s => s.events?.["Before js imports"]?.time;
// The Debug value from the first JS import, whichever start the build's Debug value uses.
export const fromJsStart = s => s.appStartupTime - (jsStartOffset(s) ?? NaN);
// Wall clock of the first JS import, from the "JS start epoch <ms>" event prepare-build.sh adds.
const jsStartEpoch = s => {
  const name = Object.keys(s.events ?? {}).find(n => /^JS start epoch \d+$/.test(n));
  return name ? Number(name.split(" ").pop()) : NaN;
};
// From the process start: the native start, whatever the Debug value counts from, plus fromJsStart.
// Needs the process start on the app's clock: the host kernel's on iOS (the simulator app shares
// it), the emulator's own on Android. Runs before processStartAppClockAt only have it on iOS.
const appClockProcessStart = s =>
  s.processStartAppClockAt ?? (s.platform === "ios" ? s.processStartAt : NaN);
const harnessNativeStart = s => jsStartEpoch(s) - (appClockProcessStart(s) ?? NaN);
export const fromProcessStart = s => harnessNativeStart(s) + fromJsStart(s);

// Where a launch's Debug value counts from:
// - "js": the first JS import (4.26, or a launch where the app found no process start);
// - "process": the process start the harness reads (LIVE-40286 on; react-native-startup-time on iOS);
// - "package": react-native-startup-time's later mark on Android, the React host creation;
// - "native": a native start, with no harness process start to tell which.
// The LIVE-40286 module is within 22 ms of the harness, the Android package 237–649 ms off (runs
// 41853176900, 40872918238, 41835997579).
export function debugBase(s) {
  const offset = jsStartOffset(s);
  if (!Number.isFinite(offset)) return null;
  if (offset < 50) return "js";
  const harness = harnessNativeStart(s);
  if (!Number.isFinite(harness)) return "native";
  return Math.abs(harness - offset) <= 100 ? "process" : "package";
}
// "native" can't be told from "process" or "package", so it matches either.
const sameBase = (a, b) =>
  a === b || (a !== "js" && b !== "js" && (a === "native" || b === "native"));
const mostCommon = values => {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;
};
const BASE_TEXT = {
  js: "the first JS import",
  process: "the process start",
  package: "react-native-startup-time's later mark",
  native: "a native start",
};

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
  // Without pairs on both sides of the swap, the device difference stays in B − A: no interval.
  const oneSideOfSwap = pairs.length > 0 && instanceBias === null;
  const hl = hodgesLehmann(adjusted);
  return {
    pairs: pairs.length,
    oneSideOfSwap,
    medianA: median(pairs.map(p => p.A)),
    medianB: median(pairs.map(p => p.B)),
    hl: oneSideOfSwap && hl ? { estimate: hl.estimate, low: null, high: null } : hl,
    spread: robustSd(centred),
    instanceBias,
    mean: oneSideOfSwap ? null : bootstrapMean(adjusted),
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
    const measured = group.filter(s => !s.warmup);
    const read = measured.filter(s => s.ok);
    // Each build's usual start. When A and B count from different ones, the Debug screen row uses the
    // time from the first JS import, which means the same in both.
    const bases = Object.fromEntries(
      ["A", "B"].map(side => [
        side,
        mostCommon(
          read
            .filter(s => s.side === side)
            .map(debugBase)
            .filter(Boolean),
        ),
      ]),
    );
    const startsDiffer = Boolean(bases.A && bases.B) && !sameBase(bases.A, bases.B);
    // A launch that counted from another start than its build's (e.g. the app found no process
    // start) would be off by the whole native start: it is left out of the Debug screen row.
    const offBase = s => {
      const base = debugBase(s);
      return base !== null && !sameBase(base, bases[s.side]);
    };
    const offBaseLaunches = Object.fromEntries(
      ["A", "B"].map(side => [side, read.filter(s => s.side === side && offBase(s)).length]),
    );
    const debugValue = difference(group, s => (offBase(s) ? NaN : s.appStartupTime));
    const jsStart = difference(group, fromJsStart);
    const withNative = difference(group, fromProcessStart);
    const screen = startsDiffer && jsStart.pairs ? jsStart : debugValue;
    const row = (measure, d, verdict) => ({
      platform,
      scenario,
      measure,
      startsDiffer,
      bases,
      offBaseLaunches: screen === debugValue ? offBaseLaunches : { A: 0, B: 0 },
      ...d,
      failed: measured.filter(s => !s.ok).length,
      launches: measured.length,
      detectable: detectableAt80(d.hl, thresholdMs),
      verdict:
        verdict ??
        (d.oneSideOfSwap
          ? "Not enough pairs: none on one side of the device swap"
          : verdictFor(preset, d.hl, thresholdMs)),
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
    "- **Debug screen**: Settings > Debug > Performance > App startup time. Builds count it from the first JS import (4.26, b3700d9164b), from the app process start (LIVE-40286 on, and react-native-startup-time on iOS before 4.26), or from the React host creation (react-native-startup-time on Android before 4.26).",
    "- **With native start**: the same end, counted from the start of the app process (the emulator's or the host's kernel) whatever the build's Debug value counts from, so builds of every version compare. It equals the Debug value of builds that count from the process start (within about 20 ms), and is about 350–650 ms above Android builds with react-native-startup-time.",
    "",
    "B − A is the Hodges–Lehmann median of the paired differences, after removing the device bias: how much slower the second emulator or simulator is than the first, measured thanks to the halfway swap.",
    `The mean (with a bootstrap 95% interval) is what the manual test compares. "Flags a slowdown of" is the true B − A the ${thresholdMs} ms gate catches 80% of the time at this noise; a true ${thresholdMs} ms is caught half the time.`,
    ...rows
      .filter(r => r.startsDiffer && r.measure.startsWith("Debug screen"))
      .map(
        r =>
          `**${r.platform} ${r.scenario}: A's Debug value counts from ${BASE_TEXT[r.bases.A]} and B's from ${BASE_TEXT[r.bases.B]}, so the Debug screen row compares the time from the first JS import.**`,
      ),
    ...rows
      .filter(r => r.measure.startsWith("Debug screen"))
      .flatMap(r =>
        ["A", "B"]
          .filter(side => r.offBaseLaunches[side] > 0)
          .map(
            side =>
              `**${r.platform} ${r.scenario}: ${r.offBaseLaunches[side]} launch(es) of build ${side} counted from another start than ${BASE_TEXT[r.bases[side]]} (e.g. the app found no process start) and are left out of the Debug screen row.**`,
          ),
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
