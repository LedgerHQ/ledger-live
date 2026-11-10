#!/usr/bin/env node
// Summarises run.ts's samples.jsonl as B − A per scenario. See README.md.
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { insideWorkingDir, isFailingVerdict } from "../../ci/step.mts";
import type { Sample, Side } from "../types.ts";
import { type ReportOptions, toMarkdown } from "./report.ts";
import {
  bootstrapMean,
  closed,
  detectableAt80,
  hodgesLehmann,
  type Interval,
  median,
  robustSd,
  unevenPhasesFactor,
  widen,
} from "./stats.ts";

/** Where a build's Debug value counts from: the first JS import (4.26–4.27) or the process start. */
export type DebugBase = "js" | "process";

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
  reads: Reads;
  failed: number;
  launches: number;
  detectable: number | null;
  verdict: string;
}

/** Where the launches were read, and how often the Debug screen agreed with the device log. */
export interface Reads {
  fromLog: number;
  /** Launches read on the screen because their log line never came. */
  fallbacks: number;
  /** Launches, warm-ups included, read from both. */
  screenChecks: number;
  screenMismatches: number;
}

function readsOf(group: Sample[]): Reads {
  const ok = group.filter(s => s.ok);
  const measured = ok.filter(s => !s.warmup);
  const checked = ok.filter(s => s.screenAppStartupTime !== undefined);
  return {
    fromLog: measured.filter(s => s.readFrom === "log").length,
    fallbacks: measured.filter(s => s.readFrom === "screen-fallback").length,
    screenChecks: checked.length,
    screenMismatches: checked.filter(s => s.screenAppStartupTime !== s.appStartupTime).length,
  };
}

export interface GateOptions {
  preset: string;
  thresholdMs: number;
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

export function failedRows(rows: Array<Pick<Row, "verdict">>): boolean {
  return !rows.length || rows.some(r => isFailingVerdict(r.verdict));
}

function verdictFor({ preset, hl, thresholdMs }: GateOptions & { hl: Interval | null }): string {
  const interval = closed(hl);
  if (!interval) return "Not enough pairs";
  const { estimate, low, high } = interval;
  const ci = `[${Math.round(low)}, ${Math.round(high)}]`;
  if (preset === "aa-noise") {
    const halfWidth = Math.round((high - low) / 2);
    const centred = low <= 0 && high >= 0;
    return `${centred ? "OK" : "Biased"}: resolves about ±${halfWidth} ms`;
  }
  if (preset === "known-regression") {
    // The gate's own rule: would prod-vs-release have failed this B?
    return estimate > thresholdMs
      ? `Detected: B is ${Math.round(estimate)} ms slower`
      : `Not detected: B − A is ${Math.round(estimate)} ms ${ci}, not above ${thresholdMs} ms`;
  }
  const inconclusive =
    low <= thresholdMs && high >= thresholdMs
      ? ` (inconclusive: ${ci} contains ${thresholdMs} ms)`
      : "";
  if (estimate > thresholdMs) {
    return `FAIL: B is slower by more than ${thresholdMs} ms${inconclusive}`;
  }
  return `PASS${inconclusive}`;
}

// Fewer would rest a phase's share of the device bias on one or two launches.
const MIN_PAIRS_PER_PHASE = 3;

const jsStartOffset = (s: Sample) => s.events?.["Before js imports"]?.time;
export const fromJsStart = (s: Sample): number =>
  (s.appStartupTime ?? Number.NaN) - (jsStartOffset(s) ?? Number.NaN);
const jsStartEpoch = (s: Sample): number => {
  const name = Object.keys(s.events ?? {}).find(n => /^JS start epoch \d+$/.test(n));
  return name ? Number(name.split(" ").pop()) : Number.NaN;
};
const harnessNativeStart = (s: Sample): number =>
  jsStartEpoch(s) - (s.processStartAppClockAt ?? Number.NaN);
export const fromProcessStart = (s: Sample): number => harnessNativeStart(s) + fromJsStart(s);

export function debugBase(s: Sample): DebugBase | null {
  const offset = jsStartOffset(s);
  if (offset === undefined || !Number.isFinite(offset)) return null;
  return offset < 50 ? "js" : "process";
}
const mostCommon = <T>(values: T[]): T | null => {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;
};

function difference(group: Sample[], metric: Metric): Difference {
  const pairs = pairUp(group, metric);
  const phase = (n: number) =>
    hodgesLehmann(pairs.filter(p => p.phase === n).map(p => p.B - p.A))?.estimate ?? Number.NaN;
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
    const startsDiffer = bases.A !== null && bases.B !== null && bases.A !== bases.B;
    const offBase = (s: Sample) => {
      const base = debugBase(s);
      return base !== null && base !== bases[s.side];
    };
    const offBaseCount = (side: Side) => read.filter(s => s.side === side && offBase(s)).length;
    const offBaseLaunches = { A: offBaseCount("A"), B: offBaseCount("B") };
    const reads = readsOf(group);
    const debugValue = difference(group, s => (offBase(s) ? Number.NaN : s.appStartupTime));
    const jsStart = difference(group, fromJsStart);
    const withNative = difference(group, fromProcessStart);
    const screen = startsDiffer && jsStart.pairs ? jsStart : debugValue;
    const row = (measure: string, d: Difference): Row => ({
      platform,
      scenario,
      measure,
      startsDiffer,
      bases,
      offBaseLaunches,
      reads,
      ...d,
      failed: measured.filter(s => !s.ok).length,
      launches: measured.length,
      detectable: detectableAt80(d.hl, thresholdMs),
      verdict: d.thinPhase
        ? `Not enough pairs: ${d.pairsPerPhase[0]} before the device swap, ${d.pairsPerPhase[1]} after (${MIN_PAIRS_PER_PHASE} needed on each side)`
        : verdictFor({ preset, hl: d.hl, thresholdMs }),
    });
    return [
      row(screen === jsStart ? "Debug screen, from JS start" : "Debug screen", screen),
      row("With native start", withNative),
    ];
  });
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      samples: { type: "string", multiple: true },
      preset: { type: "string", default: "custom" },
      "threshold-ms": { type: "string", default: "100" },
      "label-a": { type: "string", default: "A" },
      "label-b": { type: "string", default: "B" },
      json: { type: "string" },
    },
  });
  const texts = await Promise.all(
    (values.samples ?? []).map(file => readFile(insideWorkingDir(file), "utf8").catch(() => "")),
  );
  const samples: Sample[] = texts.flatMap(text =>
    text
      .split("\n")
      .filter(line => line.trim())
      .map(line => JSON.parse(line)),
  );
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
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) await appendFile(summary, markdown + "\n");
  if (values.json) {
    const json = insideWorkingDir(values.json);
    await mkdir(path.dirname(json), { recursive: true });
    await writeFile(json, JSON.stringify(rows, null, 2));
  }
  if (failedRows(rows)) {
    console.error(
      "::error::The startup check failed or could not conclude: see the verdicts above",
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
