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
import { setKeepUnchangedRates } from "@domain/entity-market-countervalues";
import type {
  CounterValuesState,
  CounterValuesStateRaw,
  CountervaluesSettings,
} from "@domain/entity-market-countervalues";
import { log } from "./logger";

// The commit this probe branch was cut from; builds embed no sha of their own.
const PROBE_BASE = "4d0bea042bd";
// Where the loop runs on that commit: "provider" (React context) or "middleware" (Redux).
const PROBE_LOOP = "middleware";
const BOOT_WINDOW_MS = 10_000;
const SUMMARY_INTERVAL_MS = 60_000;
const AFTER_SETTINGS_MS = 15_000;
const DAY_MS = 24 * 60 * 60 * 1000;
// How long after a load is stored its renders are attributed to it. Loads are 32 s apart on staging.
const LOAD_EFFECT_MS = 1_000;
// When the step 2 prototype runs: "alternate" turns it on for even loads only, so one run compares
// the same tree with and without it, load after load.
const PROTOTYPE_MODE: "alternate" | "on" | "off" = "alternate";
const now: () => number =
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? () => performance.now()
    : () => Date.now();

// storeDriven: renders where the rates this instance read changed since its previous render;
// storeDrivenSame: those of them where the hook still returned the same value; newArgSameRates:
// renders with the same rates but a new first argument (useCalculate: a memo miss); ms: time spent
// in the hook itself.
type HookStats = {
  renders: number;
  wasted: number;
  mounted: number;
  peak: number;
  storeDriven: number;
  storeDrivenSame: number;
  newArgSameRates: number;
  ms: number;
};

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
  emit("cv-probe", {
    reason,
    ...extra,
    ...loop,
    hooks,
    actions,
    ratesChangedBy,
    syncChangedBy,
    drivenBy,
    timed,
  });
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

function noStoreRates(): undefined {
  return undefined;
}

/**
 * Wraps a hook: counts its renders, its wasted renders (value equal to the one this same component
 * instance got on its previous render), and its mounted instances with their peak. With
 * `useStoreRates`, also tells renders driven by a change of the stored rates apart.
 */
export function probeHook<Args extends unknown[], Result>(
  name: string,
  hook: (...args: Args) => Result,
  same: (a: Result, b: Result) => boolean = Object.is,
  useStoreRates?: () => unknown,
): (...args: Args) => Result {
  // Same hook on every render of a given wrapper, so the call order never changes.
  const useRates = useStoreRates ?? noStoreRates;
  return function useProbedHook(...args: Args): Result {
    const rates = useRates();
    const t0 = now();
    const value = hook(...args);
    const ms = now() - t0;
    const previous = useRef<{ value: Result; rates: unknown; arg: unknown } | null>(null);
    const stats = (hooks[name] ??= {
      renders: 0,
      wasted: 0,
      mounted: 0,
      peak: 0,
      storeDriven: 0,
      storeDrivenSame: 0,
      newArgSameRates: 0,
      ms: 0,
    });
    stats.renders++;
    stats.ms += ms;
    const last = previous.current;
    const unchanged = last !== null && same(last.value, value);
    if (unchanged) stats.wasted++;
    if (last && useStoreRates) {
      if (last.rates !== rates) {
        stats.storeDriven++;
        if (unchanged) stats.storeDrivenSame++;
        attributeRender(
          name,
          isProducedRates(rates) ? (lastRatesChange ?? "unknown") : "not from countervaluesReducer",
        );
      } else if (last.arg !== args[0]) {
        stats.newArgSameRates++;
      }
    } else if (last && !unchanged) {
      attributeRender(name, lastSyncChange ?? "unknown");
    }
    previous.current = { value, rates, arg: args[0] };
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
  const prototype =
    PROTOTYPE_MODE === "on" || (PROTOTYPE_MODE === "alternate" && stats.load % 2 === 0);
  prototypeOfLoad.set(stats.load, prototype);
  setKeepUnchangedRates(prototype);
  const done = (outcome: string) => {
    if (currentLoad === stats) currentLoad = null;
    const { startedAt: loadStartedAt, ...fields } = stats;
    emitProbeEvent("load", {
      ...fields,
      windowDays: Math.round(fields.windowDays * 10) / 10,
      windowDaysMax: Math.round(fields.windowDaysMax * 10) / 10,
      durationMs: Date.now() - loadStartedAt,
      outcome,
      prototype: prototypeOfLoad.get(fields.load),
    });
  };
  return run().then(
    result => {
      done("ok");
      expectLoadSet(stats.load);
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

// Partial: combineReducers also accepts a partial preloaded state.
type ProbedStoreState = { rates?: CounterValuesState; sync?: { isPolling: boolean } };

/**
 * Call in the reducer mounted at `countervalues`: logs a summary when polling stops, and an event
 * when the stored rates end up with fewer pairs holding a latest rate. Matches the action types by
 * value.
 */
export function probeAction(state: ProbedStoreState | undefined, action: { type: string }): void {
  const { payload } = action as { type: string; payload?: unknown };
  if (action.type === "countervaluesSync/pollingSet") {
    if (state?.sync?.isPolling && payload === false) emitProbeSummary("polling-stopped");
  } else if (action.type === "countervaluesRates/set") {
    onRatesSet(state?.rates, payload as CounterValuesState);
    const next = pairsWithLatest(payload as CounterValuesState);
    if (next < pairsWithLatestNow) {
      loop.latestDrops++;
      loop.latestPairsLost += pairsWithLatestNow - next;
      emitProbeEvent("latest-drop", { from: pairsWithLatestNow, to: next });
    }
    pairsWithLatestNow = next;
  } else if (action.type === "countervaluesRates/wipe") {
    if (pairsWithLatestNow > 0) emitProbeEvent("wipe", { from: pairsWithLatestNow });
    pairsWithLatestNow = 0;
  }
}

// Every action reaches the reducer mounted at `countervalues`: counted there. ratesChangedBy and
// syncChangedBy: the action types that produced a new rates or sync object. drivenBy: for each hook,
// the action type that produced what a hook-driven render read.
const actions = { total: 0 };
const ratesChangedBy: Record<string, number> = {};
const syncChangedBy: Record<string, number> = {};
const drivenBy: Record<string, Record<string, number>> = {};
let ratesProduced: unknown;
let lastRatesChange: string | null = null;
let lastSyncChange: string | null = null;

function attributeRender(hook: string, actionType: string): void {
  const byType = (drivenBy[hook] ??= {});
  byType[actionType] = (byType[actionType] ?? 0) + 1;
}

/** Call in the reducer mounted at `countervalues` with what it returned for the action. */
export function probeStateChange(
  previous: { rates?: unknown; sync?: unknown } | undefined,
  next: { rates: unknown; sync: unknown },
  action: { type: string },
): void {
  actions.total++;
  if (previous?.rates !== next.rates) {
    ratesChangedBy[action.type] = (ratesChangedBy[action.type] ?? 0) + 1;
    lastRatesChange = action.type;
  }
  if (previous?.sync !== next.sync) {
    syncChangedBy[action.type] = (syncChangedBy[action.type] ?? 0) + 1;
    lastSyncChange = action.type;
  }
  ratesProduced = next.rates;
}

// calls and ms (performance.now, so each call also counts the timer's own cost: an upper bound).
const timed: Record<string, { calls: number; ms: number }> = {};

export function probeTimed<T>(name: string, run: () => T): T {
  const stats = (timed[name] ??= { calls: 0, ms: 0 });
  const t0 = now();
  try {
    return run();
  } finally {
    stats.calls++;
    stats.ms += now() - t0;
  }
}

export function probeSelector<Args extends unknown[], Result>(
  name: string,
  selector: (...args: Args) => Result,
): (...args: Args) => Result {
  return (...args) => probeTimed(name, () => selector(...args));
}

type RateMapOf = CounterValuesState["data"][string];
type HookCounters = Pick<
  HookStats,
  "renders" | "wasted" | "storeDriven" | "storeDrivenSame" | "newArgSameRates" | "ms"
>;

let loadAwaitingSet: number | null = null;

// The middleware stores a load's result as soon as it resolves: nothing stored by the next
// macrotask means the result was dropped.
function expectLoadSet(load: number): void {
  loadAwaitingSet = load;
  setTimeout(() => {
    if (loadAwaitingSet !== load) return;
    loadAwaitingSet = null;
    emitProbeEvent("load-effect", { load, stored: false });
  }, 0);
}

function historySize(map: RateMapOf): number {
  return map.size - (map.has("latest") ? 1 : 0);
}

function sameHistory(a: RateMapOf, b: RateMapOf): boolean {
  if (historySize(a) !== historySize(b)) return false;
  for (const [key, value] of b) if (key !== "latest" && !Object.is(a.get(key), value)) return false;
  return true;
}

/** What a stored load changed, by content and by object identity, pair by pair. */
function diffRates(previous: CounterValuesState | undefined, next: CounterValuesState) {
  const before = previous ?? { data: {}, cache: {}, status: {} };
  const ids = new Set([...Object.keys(before.data), ...Object.keys(next.data)]);
  const diff = {
    stateReplaced: previous !== next,
    pairs: ids.size,
    pairsAdded: 0,
    pairsRemoved: 0,
    latestMoved: 0,
    historyChanged: 0,
    dataReplaced: 0,
    dataReplacedSameContent: 0,
    cacheReplaced: 0,
    dataObjectReplaced: before.data !== next.data,
    cacheObjectReplaced: before.cache !== next.cache,
    statusChanged: JSON.stringify(before.status) !== JSON.stringify(next.status),
    checkHolesChanged: previous?.checkHolesOnNextLoad !== next.checkHolesOnNextLoad,
    noop: false,
    noopExceptStatus: false,
  };
  for (const id of ids) {
    const a = before.data[id];
    const b = next.data[id];
    if (!a) diff.pairsAdded++;
    else if (!b) diff.pairsRemoved++;
    else {
      const latestMoved = !Object.is(a.get("latest"), b.get("latest"));
      const historyChanged = a !== b && !sameHistory(a, b);
      if (latestMoved) diff.latestMoved++;
      if (historyChanged) diff.historyChanged++;
      if (a !== b) {
        diff.dataReplaced++;
        if (!latestMoved && !historyChanged) diff.dataReplacedSameContent++;
      }
      if (before.cache[id] !== next.cache[id]) diff.cacheReplaced++;
    }
  }
  diff.noopExceptStatus =
    diff.pairsAdded === 0 &&
    diff.pairsRemoved === 0 &&
    diff.latestMoved === 0 &&
    diff.historyChanged === 0 &&
    !diff.checkHolesChanged;
  diff.noop = diff.noopExceptStatus && !diff.statusChanged;
  return diff;
}

function snapshotHooks(): Record<string, HookCounters> {
  const out: Record<string, HookCounters> = {};
  for (const [name, s] of Object.entries(hooks)) {
    const { renders, wasted, storeDriven, storeDrivenSame, newArgSameRates, ms } = s;
    out[name] = { renders, wasted, storeDriven, storeDrivenSame, newArgSameRates, ms };
  }
  return out;
}

function hookDeltas(
  before: Record<string, HookCounters>,
  after: Record<string, HookCounters>,
): Record<string, HookCounters> {
  const out: Record<string, HookCounters> = {};
  for (const [name, a] of Object.entries(after)) {
    const b = before[name];
    const delta = {} as HookCounters;
    for (const key of Object.keys(a) as (keyof HookCounters)[])
      delta[key] = a[key] - (b?.[key] ?? 0);
    delta.ms = Math.round(delta.ms * 100) / 100;
    if (delta.renders > 0) out[name] = delta;
  }
  return out;
}

/** Called with each stored rates object: logs, for the load that produced it, what changed and what re-rendered. */
function onRatesSet(previous: CounterValuesState | undefined, next: CounterValuesState): void {
  if (loadAwaitingSet === null) return;
  const load = loadAwaitingSet;
  loadAwaitingSet = null;
  lastStoredLoad = load;
  const diff = diffRates(previous, next);
  const before = snapshotHooks();
  const { commits, renderMs } = loop;
  setTimeout(() => {
    emitProbeEvent("load-effect", {
      load,
      stored: true,
      prototype: prototypeOfLoad.get(load),
      ...diff,
      windowMs: LOAD_EFFECT_MS,
      commits: loop.commits - commits,
      renderMs: Math.round((loop.renderMs - renderMs) * 10) / 10,
      hooks: hookDeltas(before, snapshotHooks()),
    });
  }, LOAD_EFFECT_MS);
}

// Step 2. Whether the prototype ran for each load, and the last load whose result was stored.
const prototypeOfLoad = new Map<number, boolean>();
let lastStoredLoad: number | null = null;

// A cache view is a fresh object per hook instance: it comes from the reducer when its cache does.
function isProducedRates(rates: unknown): boolean {
  if (rates === ratesProduced) return true;
  const produced = ratesProduced as { cache?: unknown } | undefined;
  return (
    typeof rates === "object" &&
    rates !== null &&
    "cache" in rates &&
    rates.cache === produced?.cache
  );
}

let nextProbeInstance = 0;

/** A number that tells the mounted instances of one hook apart in the logs. */
export function useProbeInstance(): number {
  const instance = useRef<number | null>(null);
  instance.current ??= ++nextProbeInstance;
  return instance.current;
}

const lastAssetValues = new Map<string, string>();

/**
 * Logs what a Portfolio surface computed or shows, when it differs from what that same source
 * logged last, with the last load stored before it.
 */
export function probeAssetValues(source: string, values: Record<string, unknown>): void {
  const key = JSON.stringify(values);
  if (lastAssetValues.get(source) === key) return;
  lastAssetValues.set(source, key);
  emitProbeEvent("asset-values", {
    source,
    afterLoad: lastStoredLoad,
    prototype: lastStoredLoad === null ? null : prototypeOfLoad.get(lastStoredLoad),
    ...values,
  });
}
