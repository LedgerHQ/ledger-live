#!/usr/bin/env node
// Summarises run.ts's samples.jsonl as B − A per scenario. See README.md.
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import type { Sample, Side } from "./types.ts";

/** An estimate of B − A with its 95% interval; no interval below six differences. */
export interface Interval {
  estimate: number;
  low: number | null;
  high: number | null;
}

/** Where a build's Debug value counts from. */
export type DebugBase = "js" | "process" | "package" | "native";

/** A launch's value for one measure: NaN or undefined leaves the launch out. */
type Metric = (s: Sample) => number | undefined;

interface Pair {
  platform: string;
  scenario: string;
  phase: number;
  A: number;
  B: number;
}

interface Difference {
  pairs: number;
  pairsPerPhase: number[];
  thinPhase: boolean;
  medianA: number | null;
  medianB: number | null;
  hl: Interval | null;
  spread: number | null;
  instanceBias: number | null;
  mean: Interval | null;
}

/** A line of the result table, and of summary.json. */
export interface Row extends Difference {
  platform: string;
  scenario: string;
  measure: string;
  startsDiffer: boolean;
  bases: Record<Side, DebugBase | null>;
  offBaseLaunches: Record<Side, number>;
  failed: number;
  launches: number;
  detectable: number | null;
  verdict: string;
}

export interface GateOptions {
  preset: string;
  thresholdMs: number;
}

export interface ReportOptions extends GateOptions {
  labelA: string;
  labelB: string;
}

const Z_95 = 1.959964;
const SIDES: Side[] = ["A", "B"];

const middleOfSorted = (sorted: number[]): number => {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export function median(values: number[]): number | null {
  if (!values.length) return null;
  return middleOfSorted([...values].sort((a, b) => a - b));
}

// Median absolute deviation scaled to a normal SD.
export function robustSd(values: number[]): number | null {
  const m = median(values);
  if (m === null) return null;
  const deviation = median(values.map(v => Math.abs(v - m)));
  return deviation === null ? null : 1.4826 * deviation;
}

// Normal-approximation Wilcoxon interval (Hollander & Wolfe): C-th smallest and largest Walsh averages.
export function hodgesLehmann(diffs: number[]): Interval | null {
  const n = diffs.length;
  if (!n) return null;
  const walsh: number[] = [];
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) walsh.push((diffs[i] + diffs[j]) / 2);
  walsh.sort((a, b) => a - b);
  const estimate = middleOfSorted(walsh);
  if (n < 6) return { estimate, low: null, high: null };
  const k = (n * (n + 1)) / 4 - Z_95 * Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24);
  const c = Math.max(1, Math.floor(k + 0.5));
  return { estimate, low: walsh[c - 1], high: walsh[walsh.length - c] };
}

export function pairUp(samples: Sample[], metric: Metric): Pair[] {
  const byKey = new Map<string, Omit<Pair, Side> & Partial<Pick<Pair, Side>>>();
  for (const s of samples) {
    if (!s.ok || s.warmup) continue;
    const value = metric(s);
    if (value === undefined || !Number.isFinite(value)) continue;
    const key = `${s.platform}|${s.scenario}|${s.phase}|${s.round}`;
    const entry = byKey.get(key) ?? { platform: s.platform, scenario: s.scenario, phase: s.phase };
    entry[s.side] = value;
    byKey.set(key, entry);
  }
  return [...byKey.values()].filter((p): p is Pair => Number.isFinite(p.A) && Number.isFinite(p.B));
}

const isGate = (preset: string) => !["aa-noise", "known-regression"].includes(preset);

export function failedRows(rows: Array<Pick<Row, "verdict">>): boolean {
  return !rows.length || rows.some(r => /^(FAIL|Not detected|Not enough pairs)/.test(r.verdict));
}

function verdictFor({ preset, hl, thresholdMs }: GateOptions & { hl: Interval | null }): string {
  if (!hl || hl.low === null || hl.high === null) return "Not enough pairs";
  const ci = `[${Math.round(hl.low)}, ${Math.round(hl.high)}]`;
  if (preset === "aa-noise") {
    const halfWidth = Math.round((hl.high - hl.low) / 2);
    const centred = hl.low <= 0 && hl.high >= 0;
    return `${centred ? "OK" : "Biased"}: resolves about ±${halfWidth} ms`;
  }
  if (preset === "known-regression") {
    // B is the fix: a visible regression means B − A is clearly below zero.
    return hl.high < 0
      ? `Detected: the fix is ${Math.round(-hl.estimate)} ms faster`
      : `Not detected ${ci}`;
  }
  const inconclusive =
    hl.low <= thresholdMs && hl.high >= thresholdMs
      ? ` (inconclusive: ${ci} contains ${thresholdMs} ms)`
      : "";
  if (hl.estimate > thresholdMs) {
    return `FAIL: B is slower by more than ${thresholdMs} ms${inconclusive}`;
  }
  return `PASS${inconclusive}`;
}

// Fewer would rest a phase's share of the device bias on one or two launches.
const MIN_PAIRS_PER_PHASE = 3;

// The true B − A the gate flags 80% of the time: the threshold plus 0.84 standard errors.
export function detectableAt80(hl: Interval | null, thresholdMs: number): number | null {
  if (!hl || hl.low === null || hl.high === null) return null;
  return thresholdMs + 0.8416 * ((hl.high - hl.low) / (2 * Z_95));
}

// Seeded, so the same samples always give the same interval.
export function bootstrapMean(
  diffs: number[],
  resamples = 4000,
): { estimate: number; low: number; high: number } | null {
  const n = diffs.length;
  if (n < 6) return null;
  let seed = 0x9e3779b9;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const mean = (values: number[]) => values.reduce((a, v) => a + v, 0) / values.length;
  const means: number[] = [];
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

const jsStartOffset = (s: Sample) => s.events?.["Before js imports"]?.time;
export const fromJsStart = (s: Sample): number =>
  (s.appStartupTime ?? NaN) - (jsStartOffset(s) ?? NaN);
const jsStartEpoch = (s: Sample): number => {
  const name = Object.keys(s.events ?? {}).find(n => /^JS start epoch \d+$/.test(n));
  return name ? Number(name.split(" ").pop()) : NaN;
};
// Samples from before processStartAppClockAt only have the app's clock on iOS (the host's).
const appClockProcessStart = (s: Sample) =>
  s.processStartAppClockAt ?? (s.platform === "ios" ? s.processStartAt : NaN);
const harnessNativeStart = (s: Sample): number =>
  jsStartEpoch(s) - (appClockProcessStart(s) ?? NaN);
export const fromProcessStart = (s: Sample): number => harnessNativeStart(s) + fromJsStart(s);

export function debugBase(s: Sample): DebugBase | null {
  const offset = jsStartOffset(s);
  if (offset === undefined || !Number.isFinite(offset)) return null;
  if (offset < 50) return "js";
  const harness = harnessNativeStart(s);
  if (!Number.isFinite(harness)) return "native";
  return Math.abs(harness - offset) <= 100 ? "process" : "package";
}
// "native" can't be told from "process" or "package", so it matches either.
const sameBase = (a: DebugBase, b: DebugBase | null) =>
  a === b || (a !== "js" && b !== "js" && (a === "native" || b === "native"));
const mostCommon = <T>(values: T[]): T | null => {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;
};
const BASE_TEXT: Record<DebugBase, string> = {
  js: "the first JS import",
  process: "the process start",
  package: "react-native-startup-time's later mark",
  native: "a native start",
};
const baseText = (base: DebugBase | null) => (base ? BASE_TEXT[base] : "an unknown start");

function difference(group: Sample[], metric: Metric): Difference {
  const pairs = pairUp(group, metric);
  const phase = (n: number) =>
    hodgesLehmann(pairs.filter(p => p.phase === n).map(p => p.B - p.A))?.estimate ?? NaN;
  const phase0 = phase(0);
  const phase1 = phase(1);
  // Phase 0 puts B on the second device, phase 1 on the first: half their gap is the device bias.
  const instanceBias =
    Number.isFinite(phase0) && Number.isFinite(phase1) ? (phase0 - phase1) / 2 : null;
  const adjusted = pairs.map(p => p.B - p.A - (instanceBias ?? 0) * (p.phase === 0 ? 1 : -1));
  const centred = [0, 1].flatMap(n => {
    const d = pairs.filter(p => p.phase === n).map(p => p.B - p.A);
    const m = median(d);
    return m === null ? [] : d.map(v => v - m);
  });
  const pairsPerPhase = [0, 1].map(n => pairs.filter(p => p.phase === n).length);
  const thinPhase = pairs.length > 0 && Math.min(...pairsPerPhase) < MIN_PAIRS_PER_PHASE;
  const widening =
    Math.min(...pairsPerPhase) > 0 ? unevenPhasesFactor(pairsPerPhase[0], pairsPerPhase[1]) : 1;
  const hl = hodgesLehmann(adjusted);
  return {
    pairs: pairs.length,
    pairsPerPhase,
    thinPhase,
    medianA: median(pairs.map(p => p.A)),
    medianB: median(pairs.map(p => p.B)),
    hl: thinPhase && hl ? { estimate: hl.estimate, low: null, high: null } : widen(hl, widening),
    spread: robustSd(centred),
    instanceBias,
    mean: thinPhase ? null : widen(bootstrapMean(adjusted), widening),
  };
}

/**
 * How much wider the B − A interval is than the pooled pairs give: the device bias correction
 * averages the two phases, so uneven ones add uncertainty. 1 when both phases have as many pairs.
 */
export function unevenPhasesFactor(n0: number, n1: number): number {
  return Math.sqrt(((n0 + n1) / 4) * (1 / n0 + 1 / n1));
}

const widen = <T extends Interval>(interval: T | null, factor: number): T | null =>
  factor !== 1 && interval && interval.low !== null && interval.high !== null
    ? {
        ...interval,
        low: interval.estimate - factor * (interval.estimate - interval.low),
        high: interval.estimate + factor * (interval.high - interval.estimate),
      }
    : interval;

export function summarise(samples: Sample[], { preset, thresholdMs }: GateOptions): Row[] {
  const groups = new Map<string, Sample[]>();
  for (const s of samples) {
    const key = `${s.platform}|${s.scenario}`;
    const group = groups.get(key) ?? [];
    group.push(s);
    groups.set(key, group);
  }
  return [...groups.entries()].flatMap(([key, group]) => {
    const [platform, scenario] = key.split("|");
    const measured = group.filter(s => !s.warmup);
    const read = measured.filter(s => s.ok);
    const baseOf = (side: Side) =>
      mostCommon(
        read
          .filter(s => s.side === side)
          .map(debugBase)
          .filter(base => base !== null),
      );
    const bases = { A: baseOf("A"), B: baseOf("B") };
    const startsDiffer = bases.A !== null && bases.B !== null && !sameBase(bases.A, bases.B);
    const offBase = (s: Sample) => {
      const base = debugBase(s);
      return base !== null && !sameBase(base, bases[s.side]);
    };
    const offBaseCount = (side: Side) => read.filter(s => s.side === side && offBase(s)).length;
    const offBaseLaunches = { A: offBaseCount("A"), B: offBaseCount("B") };
    const debugValue = difference(group, s => (offBase(s) ? NaN : s.appStartupTime));
    const jsStart = difference(group, fromJsStart);
    const withNative = difference(group, fromProcessStart);
    const screen = startsDiffer && jsStart.pairs ? jsStart : debugValue;
    const row = (measure: string, d: Difference, verdict?: string): Row => ({
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
        (d.thinPhase
          ? `Not enough pairs: ${d.pairsPerPhase[0]} before the device swap, ${d.pairsPerPhase[1]} after (${MIN_PAIRS_PER_PHASE} needed on each side)`
          : verdictFor({ preset, hl: d.hl, thresholdMs })),
    });
    const withoutEpoch = SIDES.filter(
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

const fmt = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? String(Math.round(v)) : "–";
const signed = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? `${v > 0 ? "+" : ""}${Math.round(v)}` : "–";

export function toMarkdown(
  rows: Row[],
  { preset, labelA, labelB, thresholdMs }: ReportOptions,
): string {
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
    "- **Debug screen**: Settings > Debug > Performance > App startup time. Builds count it from the first JS import (4.26–4.27, b3700d9164b), from the app process start (LIVE-40286 on, and react-native-startup-time on iOS before 4.26), or from the React host creation (react-native-startup-time on Android before 4.26).",
    "- **With native start**: the same end, counted from the start of the app process (the emulator's or the host's kernel) whatever the build's Debug value counts from, so builds of every version compare. It equals the Debug value of builds that count from the process start (within about 20 ms), and is about 350–650 ms above Android builds with react-native-startup-time.",
    "",
    "B − A is the Hodges–Lehmann median of the paired differences, after removing the device bias: how much slower the second emulator or simulator is than the first, measured thanks to the halfway swap.",
    `The mean (with a bootstrap 95% interval) is what the manual test compares. "Flags a slowdown of" is the true B − A the ${thresholdMs} ms gate catches 80% of the time at this noise; a true ${thresholdMs} ms is caught half the time.`,
    ...rows
      .filter(r => r.startsDiffer && r.measure.startsWith("Debug screen"))
      .map(
        r =>
          `**${r.platform} ${r.scenario}: A's Debug value counts from ${baseText(r.bases.A)} and B's from ${baseText(r.bases.B)}, so the Debug screen row compares the time from the first JS import.**`,
      ),
    ...rows
      .filter(r => r.measure.startsWith("Debug screen"))
      .flatMap(r =>
        SIDES.filter(side => r.offBaseLaunches[side] > 0).map(
          side =>
            `**${r.platform} ${r.scenario}: ${r.offBaseLaunches[side]} launch(es) of build ${side} counted from another start than ${baseText(r.bases[side])} (e.g. the app found no process start) and are left out of the Debug screen row.**`,
        ),
      ),
    "",
  );
  return lines.filter((l, i) => l !== "" || lines[i - 1] !== "").join("\n");
}

async function main(): Promise<void> {
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
  const samples: Sample[] = [];
  for (const file of values.samples ?? []) {
    const text = await readFile(file, "utf8").catch(() => "");
    for (const line of text.split("\n")) if (line.trim()) samples.push(JSON.parse(line));
  }
  const options: ReportOptions = {
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
