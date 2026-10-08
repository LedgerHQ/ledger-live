// MEASUREMENT BUILD ONLY, NEVER MERGE.
// Counts renders of the countervalues hooks, and the provider's restores and loads, and logs one
// cumulative summary line, type `cv-probe`, through the package logger: 10 s after the provider
// mounts, every 60 s, and each time polling stops (window blur on desktop, background on mobile).
// `probeHook` wraps any hook, so the same file applies on any branch.
import { useEffect, useRef, type ProfilerOnRenderCallback } from "react";
import { log } from "./logger";

// The develop commit this probe branch was cut from; builds embed no sha of their own.
const PROBE_BASE = "cd3b2875247b0cb8d2950a123bbf4eaddaa50e8d";
const BOOT_WINDOW_MS = 10_000;
const SUMMARY_INTERVAL_MS = 60_000;

type HookStats = { renders: number; wasted: number; mounted: number; peak: number };

const startedAt = Date.now();
const hooks: Record<string, HookStats> = {};
const provider = {
  providerRenders: 0,
  bridgeChanges: 0,
  effectRenders: 0,
  restores: 0,
  loads: 0,
  bootRestores: 0,
  bootLoads: 0,
  // Whole tree under the provider, from a root <Profiler>. Both stay 0 when React is not a
  // profiling build: then the build did not pick the profiling renderer.
  commits: 0,
  renderMs: 0,
};
let mountedAt: number | null = null;
let summaries = 0;
let timer: ReturnType<typeof setInterval> | null = null;

function statsOf(name: string): HookStats {
  hooks[name] ??= { renders: 0, wasted: 0, mounted: 0, peak: 0 };
  return hooks[name];
}

export function emitProbeSummary(reason: string): void {
  summaries++;
  const payload = {
    base: PROBE_BASE,
    reason,
    seq: summaries,
    elapsedMs: Date.now() - startedAt,
    sinceMountMs: mountedAt === null ? null : Date.now() - mountedAt,
    ...provider,
    hooks,
  };
  log("cv-probe", `cv-probe ${JSON.stringify(payload)}`);
}

function ensureTimer(): void {
  timer ??= setInterval(() => emitProbeSummary("interval"), SUMMARY_INTERVAL_MS);
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
    const stats = statsOf(name);
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

/** The root <Profiler>'s callback: counts commits and sums their render time. */
export const onProbeCommit: ProfilerOnRenderCallback = (_id, _phase, actualDuration) => {
  provider.commits++;
  provider.renderMs += actualDuration;
};

/** Call where the provider restores the saved state, or starts a load. */
export function countProbe(kind: "restores" | "loads"): void {
  provider[kind]++;
  if (mountedAt !== null && Date.now() - mountedAt < BOOT_WINDOW_MS) {
    provider[kind === "restores" ? "bootRestores" : "bootLoads"]++;
  }
}

/** Call in the provider's render: counts its renders and the changes of the bridge identity. */
export function useProbeBridge(bridge: unknown): void {
  const previous = useRef(bridge);
  if (mountedAt === null) {
    mountedAt = Date.now();
    setTimeout(() => emitProbeSummary("boot"), BOOT_WINDOW_MS);
    ensureTimer();
  }
  provider.providerRenders++;
  if (previous.current !== bridge) provider.bridgeChanges++;
  previous.current = bridge;
}

/** Call in the polling loop's render: counts its renders and logs a summary when polling stops. */
export function useProbeEffect(isPolling: boolean): void {
  provider.effectRenders++;
  const wasPolling = useRef(isPolling);
  useEffect(() => {
    if (wasPolling.current && !isPolling) emitProbeSummary("polling-stopped");
    wasPolling.current = isPolling;
  }, [isPolling]);
}
