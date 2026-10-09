// MEASUREMENT BUILD ONLY, NEVER MERGE.
// Counts renders of the countervalues hooks and what the countervalues loop does, and logs two
// kinds of lines through the package logger and console.log (so `adb logcat` streams them from a
// release build, where the mobile VERBOSE switch is fixed at build time):
// - `cv-probe {json}`, a cumulative summary: 10 s after the loop starts, every 60 s, each time
//   polling stops (window blur on desktop, background on mobile), and at each settings change and
//   15 s after it;
// - `cv-probe-event {json}`, one per settings change, restore, load, and drop of latest rates.
// The same file sits on every probe branch; only PROBE_BASE and PROBE_LOOP differ.
import {
  createElement,
  Profiler,
  useEffect,
  useRef,
  type ProfilerOnRenderCallback,
  type ReactElement,
  type ReactNode,
} from "react";
import type { RateSource } from "@domain/api-market-countervalues";
import type {
  CounterValuesState,
  CounterValuesStateRaw,
  CountervaluesSettings,
} from "@domain/entity-market-countervalues";
import { log } from "./logger";

// The commit this probe branch was cut from; builds embed no sha of their own.
const PROBE_BASE = "829a01505e7a9a9da207bc0b72641bf60d4bfc69";
// Where the loop runs on that commit: "provider" (React context) or "middleware" (Redux).
const PROBE_LOOP = "provider";
const BOOT_WINDOW_MS = 10_000;
const SUMMARY_INTERVAL_MS = 60_000;
const AFTER_SETTINGS_MS = 15_000;
const DAY_MS = 24 * 60 * 60 * 1000;

type HookStats = { renders: number; wasted: number; mounted: number; peak: number };

type LoadStats = {
  load: number;
  startedAt: number;
  trackingPairs: number;
  windows: number;
  windowDays: number;
  windowDaysMax: number;
  spotCalls: number;
  spotPairs: number;
};

const startedAt = Date.now();
const hooks: Record<string, HookStats> = {};
const loop = {
  loopStarts: 0,
  // Provider only: its renders, the changes of its context value, the polling loop's renders.
  providerRenders: 0,
  bridgeChanges: 0,
  effectRenders: 0,
  restores: 0,
  loads: 0,
  bootRestores: 0,
  bootLoads: 0,
  settingsChanges: 0,
  // Requests to the rate source: windows of history, and spot batches.
  historicalCalls: 0,
  historicalDays: 0,
  latestCalls: 0,
  latestPairs: 0,
  // Times the stored state lost pairs with a latest rate, and how many pairs in all.
  latestDrops: 0,
  latestPairsLost: 0,
  // Whole app, from a <Profiler> at its root. Both stay 0 when React is not a profiling build.
  commits: 0,
  renderMs: 0,
};
let loopStartedAt: number | null = null;
let seq = 0;
let timer: ReturnType<typeof setInterval> | null = null;
let currentLoad: LoadStats | null = null;
let lastSettings: CountervaluesSettings | null = null;
let pairsWithLatestNow = 0;

function sinceLoopStart(): number | null {
  return loopStartedAt === null ? null : Date.now() - loopStartedAt;
}

function emit(kind: "cv-probe" | "cv-probe-event", payload: Record<string, unknown>): void {
  seq++;
  const line = `${kind} ${JSON.stringify({
    base: PROBE_BASE,
    loop: PROBE_LOOP,
    seq,
    elapsedMs: Date.now() - startedAt,
    sinceLoopStartMs: sinceLoopStart(),
    ...payload,
  })}`;
  log("cv-probe", line);
  // eslint-disable-next-line no-console
  console.log(line);
}

export function emitProbeSummary(reason: string, extra: Record<string, unknown> = {}): void {
  emit("cv-probe", { reason, ...extra, ...loop, hooks });
}

function emitProbeEvent(event: string, fields: Record<string, unknown>): void {
  emit("cv-probe-event", { event, ...fields });
}

function ensureTimer(): void {
  timer ??= setInterval(() => emitProbeSummary("interval"), SUMMARY_INTERVAL_MS);
}

function inBootWindow(): boolean {
  const since = sinceLoopStart();
  return since !== null && since < BOOT_WINDOW_MS;
}

function pairsWithLatest(state: CounterValuesState): number {
  let n = 0;
  for (const map of Object.values(state.data)) if (map instanceof Map && map.has("latest")) n++;
  return n;
}

/** Call where the loop starts: the provider's first render, or the middleware's start. */
export function markLoopStart(): void {
  loop.loopStarts++;
  emitProbeEvent("loop-start", { loopStarts: loop.loopStarts });
  if (loopStartedAt !== null) return;
  loopStartedAt = Date.now();
  setTimeout(() => emitProbeSummary("boot"), BOOT_WINDOW_MS);
  ensureTimer();
}

/**
 * Wraps a hook: counts its renders, its wasted renders (value equal to the one this same component
 * instance got on its previous render), and its mounted instances with their peak.
 */
export function probeHook<Args extends unknown[], Result>(
  name: string,
  hook: (...args: Args) => Result,
  same: (a: Result, b: Result) => boolean = Object.is,
): (...args: Args) => Result {
  return function useProbedHook(...args: Args): Result {
    const value = hook(...args);
    const previous = useRef<{ value: Result } | null>(null);
    const stats = (hooks[name] ??= { renders: 0, wasted: 0, mounted: 0, peak: 0 });
    stats.renders++;
    if (previous.current && same(previous.current.value, value)) stats.wasted++;
    previous.current = { value };
    useEffect(() => {
      stats.mounted++;
      stats.peak = Math.max(stats.peak, stats.mounted);
      ensureTimer();
      return () => {
        stats.mounted--;
      };
    }, [stats]);
    return value;
  };
}

const onProbeCommit: ProfilerOnRenderCallback = (_id, _phase, actualDuration) => {
  loop.commits++;
  loop.renderMs += actualDuration;
};

/** Put at the app's root: counts every commit of the app and sums its render time. */
export function CountervaluesProbeProfiler({ children }: { children: ReactNode }): ReactElement {
  return createElement(Profiler, { id: "cv-probe", onRender: onProbeCommit }, children);
}

const probedRates = new WeakMap<RateSource, RateSource>();

/** Wraps the loop's rate source to count its requests, overall and per load. Same in, same out. */
export function probeRates(rates: RateSource): RateSource {
  const known = probedRates.get(rates);
  if (known) return known;
  const probed: RateSource = {
    fetchHistorical: (granularity, query) => {
      const days = (Date.now() - query.startDate.getTime()) / DAY_MS;
      loop.historicalCalls++;
      loop.historicalDays += days;
      if (currentLoad) {
        currentLoad.windows++;
        currentLoad.windowDays += days;
        currentLoad.windowDaysMax = Math.max(currentLoad.windowDaysMax, days);
      }
      return rates.fetchHistorical(granularity, query);
    },
    fetchLatest: pairs => {
      loop.latestCalls++;
      loop.latestPairs += pairs.length;
      if (currentLoad) {
        currentLoad.spotCalls++;
        currentLoad.spotPairs += pairs.length;
      }
      return rates.fetchLatest(pairs);
    },
  };
  probedRates.set(rates, probed);
  return probed;
}

/** Wraps one load: counts it and logs what it asked for and how long it took. */
export function probeLoad<T>(settings: CountervaluesSettings, run: () => Promise<T>): Promise<T> {
  loop.loads++;
  if (inBootWindow()) loop.bootLoads++;
  const stats: LoadStats = {
    load: loop.loads,
    startedAt: Date.now(),
    trackingPairs: settings.trackingPairs.length,
    windows: 0,
    windowDays: 0,
    windowDaysMax: 0,
    spotCalls: 0,
    spotPairs: 0,
  };
  currentLoad = stats;
  const done = (outcome: string) => {
    if (currentLoad === stats) currentLoad = null;
    const { startedAt: loadStartedAt, ...fields } = stats;
    emitProbeEvent("load", {
      ...fields,
      windowDays: Math.round(fields.windowDays * 10) / 10,
      windowDaysMax: Math.round(fields.windowDaysMax * 10) / 10,
      durationMs: Date.now() - loadStartedAt,
      outcome,
    });
  };
  return run().then(
    result => {
      done("ok");
      return result;
    },
    (error: unknown) => {
      done("error");
      throw error;
    },
  );
}

/** Call with what a restore is about to store. */
export function probeRestore(
  savedState: CounterValuesStateRaw,
  restored: CounterValuesState,
): void {
  loop.restores++;
  if (inBootWindow()) loop.bootRestores++;
  emitProbeEvent("restore", {
    restore: loop.restores,
    savedPairs: Object.keys(savedState).filter(key => key !== "status").length,
    pairsWithLatestBefore: pairsWithLatestNow,
    pairsWithLatestAfter: pairsWithLatest(restored),
  });
}

/** Call with the settings the loop loads with, each time it reads them: logs each new object. */
export function probeSettings(settings: CountervaluesSettings): void {
  if (settings === lastSettings) return;
  const first = lastSettings === null;
  lastSettings = settings;
  const change = ++loop.settingsChanges;
  emitProbeEvent("settings", {
    change,
    first,
    trackingPairs: settings.trackingPairs.length,
    refreshRate: settings.refreshRate,
  });
  emitProbeSummary("settings", { change });
  setTimeout(() => emitProbeSummary("settings+15s", { change }), AFTER_SETTINGS_MS);
}

/** Provider only: call in its render with its context value. */
export function useProbeBridge(bridge: unknown): void {
  const previous = useRef(bridge);
  if (loopStartedAt === null) markLoopStart();
  loop.providerRenders++;
  if (previous.current !== bridge) loop.bridgeChanges++;
  previous.current = bridge;
}

/** Provider only: call in the polling loop's render. */
export function countEffectRender(): void {
  loop.effectRenders++;
}

type ProbedSliceState = { polling: { isPolling: boolean } };

/**
 * Call at the top of the slice reducer: logs a summary when polling stops, and an event when the
 * stored state ends up with fewer pairs holding a latest rate. Matches the action types by value.
 */
export function probeAction(state: ProbedSliceState | undefined, action: { type: string }): void {
  const { payload } = action as { type: string; payload?: unknown };
  if (action.type === "COUNTERVALUES_POLLING_SET_IS_POLLING") {
    if (state?.polling.isPolling && payload === false) emitProbeSummary("polling-stopped");
  } else if (action.type === "COUNTERVALUES_STATE_SET") {
    const next = pairsWithLatest(payload as CounterValuesState);
    if (next < pairsWithLatestNow) {
      loop.latestDrops++;
      loop.latestPairsLost += pairsWithLatestNow - next;
      emitProbeEvent("latest-drop", { from: pairsWithLatestNow, to: next });
    }
    pairsWithLatestNow = next;
  } else if (action.type === "COUNTERVALUES_WIPE") {
    if (pairsWithLatestNow > 0) emitProbeEvent("wipe", { from: pairsWithLatestNow });
    pairsWithLatestNow = 0;
  }
}
