#!/usr/bin/env python3
# MEASUREMENT BUILD ONLY, NEVER MERGE.
# Applies the countervalues probe to a tree where the loop is the Redux middleware in
# state/internals/middleware.ts and the store slice is split into rates and sync.
# Usage: cv-probe-apply.py <repo> <sha the tree was cut from> [alternate|on|off]
# The third argument says when the step 2 prototype runs: on every other load (default, so one run
# compares the same tree with and without it), on every load, or never.
# Needs the commits e2e7d2bd2c6 and 742ca707c5f (origin/measure/countervalues-rerender-probe-head):
# the probe module, the parser and the React profiling hunks are taken from there.
import re
import subprocess
import sys

repo, sha = sys.argv[1:3]
prototype_mode = sys.argv[3] if len(sys.argv) > 3 else "alternate"
assert prototype_mode in ("alternate", "on", "off"), prototype_mode
PKG = "features/platform/market-countervalues"
PROBE_HEAD = "742ca707c5f"


def git(*args, stdin=None):
    return subprocess.run(
        ["git", *args], cwd=repo, check=True, capture_output=True, text=True, input=stdin
    ).stdout


def read(p):
    with open(f"{repo}/{p}") as f:
        return f.read()


def write(p, s):
    with open(f"{repo}/{p}", "w") as f:
        f.write(s)


def rep(p, old, new):
    s = read(p)
    assert s.count(old) == 1, (p, old, s.count(old))
    write(p, s.replace(old, new))


# 1. The probe module, next to the package logger, and the parser.
probe = git("show", f"{PROBE_HEAD}:{PKG}/src/internals/renderProbe.ts")
probe, n = re.subn(r'const PROBE_BASE = "[^"]*";', f'const PROBE_BASE = "{sha}";', probe)
assert n == 1
assert 'const PROBE_LOOP = "middleware";' in probe
old_action = probe[probe.index("type ProbedSliceState") :]
new_action = '''// Partial: combineReducers also accepts a partial preloaded state.
type ProbedStoreState = { sync?: { isPolling: boolean } };

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
'''
probe = probe.replace(old_action, new_action)


def sub(text, old, new):
    assert text.count(old) == 1, (old, text.count(old))
    return text.replace(old, new)


# 1b. Per-load root cause: what each stored load changed, and which hook renders it caused.
probe = sub(probe, "type HookStats = { renders: number; wasted: number; mounted: number; peak: number };\n",
            """// storeDriven: renders where the rates this instance read changed since its previous render;
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
""")
old_hook = probe[probe.index("/**\n * Wraps a hook: counts") : probe.index("const onProbeCommit")]
probe = probe.replace(old_hook, '''function noStoreRates(): undefined {
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
          rates === ratesProduced ? (lastRatesChange ?? "unknown") : "not from countervaluesReducer",
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

''')
probe = sub(probe, """    result => {
      done("ok");
      return result;""", """    result => {
      done("ok");
      expectLoadSet(stats.load);
      return result;""")
probe = sub(probe, "type ProbedStoreState = { sync?: { isPolling: boolean } };",
            "type ProbedStoreState = { rates?: CounterValuesState; sync?: { isPolling: boolean } };")
probe = sub(probe, """  } else if (action.type === "countervaluesRates/set") {
    const next = pairsWithLatest(payload as CounterValuesState);""", """  } else if (action.type === "countervaluesRates/set") {
    onRatesSet(state?.rates, payload as CounterValuesState);
    const next = pairsWithLatest(payload as CounterValuesState);""")
probe = sub(probe, "const DAY_MS = 24 * 60 * 60 * 1000;\n", """const DAY_MS = 24 * 60 * 60 * 1000;
// How long after a load is stored its renders are attributed to it. Loads are 32 s apart on staging.
const LOAD_EFFECT_MS = 1_000;
const now: () => number =
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? () => performance.now()
    : () => Date.now();
""")
probe = sub(probe, "  emit(\"cv-probe\", { reason, ...extra, ...loop, hooks });",
            "  emit(\"cv-probe\", {\n    reason,\n    ...extra,\n    ...loop,\n    hooks,\n"
            "    actions,\n    ratesChangedBy,\n    syncChangedBy,\n    drivenBy,\n    timed,\n  });")
probe += '''
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
'''
probe += '''
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
    for (const key of Object.keys(a) as (keyof HookCounters)[]) delta[key] = a[key] - (b?.[key] ?? 0);
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
  const diff = diffRates(previous, next);
  const before = snapshotHooks();
  const { commits, renderMs } = loop;
  setTimeout(() => {
    emitProbeEvent("load-effect", {
      load,
      stored: true,
      ...diff,
      windowMs: LOAD_EFFECT_MS,
      commits: loop.commits - commits,
      renderMs: Math.round((loop.renderMs - renderMs) * 10) / 10,
      hooks: hookDeltas(before, snapshotHooks()),
    });
  }, LOAD_EFFECT_MS);
}
'''
# 1c. Step 2: the prototype switch, per load; renders driven by the cache view; Portfolio values.
probe = sub(probe, 'import type { RateSource } from "@domain/api-market-countervalues";\n',
            'import type { RateSource } from "@domain/api-market-countervalues";\n'
            'import { setKeepUnchangedRates } from "@domain/entity-market-countervalues";\n')
probe = sub(probe, "const LOAD_EFFECT_MS = 1_000;\n", f"""const LOAD_EFFECT_MS = 1_000;
// When the step 2 prototype runs: "alternate" turns it on for even loads only, so one run compares
// the same tree with and without it, load after load.
const PROTOTYPE_MODE: "alternate" | "on" | "off" = "{prototype_mode}";
""")
probe = sub(probe, """  currentLoad = stats;
  const done = (outcome: string) => {""", """  currentLoad = stats;
  const prototype =
    PROTOTYPE_MODE === "on" || (PROTOTYPE_MODE === "alternate" && stats.load % 2 === 0);
  prototypeOfLoad.set(stats.load, prototype);
  setKeepUnchangedRates(prototype);
  const done = (outcome: string) => {""")
probe = sub(probe, """      durationMs: Date.now() - loadStartedAt,
      outcome,""", """      durationMs: Date.now() - loadStartedAt,
      outcome,
      prototype: prototypeOfLoad.get(fields.load),""")
probe = sub(probe, """          rates === ratesProduced ? (lastRatesChange ?? "unknown") : "not from countervaluesReducer",""",
            """          isProducedRates(rates)
            ? (lastRatesChange ?? "unknown")
            : "not from countervaluesReducer",""")
probe = sub(probe, """    statusChanged: JSON.stringify(before.status) !== JSON.stringify(next.status),""",
            """    dataObjectReplaced: before.data !== next.data,
    cacheObjectReplaced: before.cache !== next.cache,
    statusChanged: JSON.stringify(before.status) !== JSON.stringify(next.status),""")
probe = sub(probe, """  if (loadAwaitingSet === null) return;
  const load = loadAwaitingSet;
  loadAwaitingSet = null;""", """  if (loadAwaitingSet === null) return;
  const load = loadAwaitingSet;
  loadAwaitingSet = null;
  lastStoredLoad = load;""")
probe = sub(probe, """      load,
      stored: true,
      ...diff,""", """      load,
      stored: true,
      prototype: prototypeOfLoad.get(load),
      ...diff,""")
probe += '''
// Step 2. Whether the prototype ran for each load, and the last load whose result was stored.
const prototypeOfLoad = new Map<number, boolean>();
let lastStoredLoad: number | null = null;

// A cache view is a fresh object per hook instance: it comes from the reducer when its cache does.
function isProducedRates(rates: unknown): boolean {
  if (rates === ratesProduced) return true;
  const produced = ratesProduced as { cache?: unknown } | undefined;
  return (
    typeof rates === "object" && rates !== null && "cache" in rates && rates.cache === produced?.cache
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
'''
write(f"{PKG}/src/utils/internals/renderProbe.ts", probe)
write(f"{PKG}/cv-probe-parse.mjs", git("show", f"{PROBE_HEAD}:{PKG}/cv-probe-parse.mjs"))

# 2. Barrel: counted hooks shadow the re-exported ones; the root profiler.
s = read(f"{PKG}/src/index.ts")
s += """
// MEASUREMENT BUILD ONLY, NEVER MERGE. These local exports shadow the hooks re-exported above, so
// every consumer of the package gets the counted version.
import * as Hooks from "./hooks/countervaluesHooks";
import { probeHook } from "./utils/internals/renderProbe";

export {
  CountervaluesProbeProfiler,
  probeAssetValues,
  useProbeInstance,
} from "./utils/internals/renderProbe";

type SendAmount = ReturnType<typeof Hooks.useSendAmount>;

// useSendAmount returns a new object and a new BigNumber on every render: compare by member.
function sameSendAmount(a: SendAmount, b: SendAmount): boolean {
  return (
    a.fiatAmount.isEqualTo(b.fiatAmount) &&
    a.fiatUnit === b.fiatUnit &&
    a.calculateCryptoAmount === b.calculateCryptoAmount
  );
}

export const useCountervaluesState = probeHook(
  "useCountervaluesState",
  Hooks.useCountervaluesState,
  Object.is,
  Hooks.useCountervaluesState,
);
export const useCountervaluesCache = probeHook(
  "useCountervaluesCache",
  Hooks.useCountervaluesCache,
  Object.is,
  Hooks.useCountervaluesCache,
);
export const useCountervaluesPolling = probeHook(
  "useCountervaluesPolling",
  Hooks.useCountervaluesPolling,
);
export const useCountervaluesLoadStatus = probeHook(
  "useCountervaluesLoadStatus",
  Hooks.useCountervaluesLoadStatus,
);
export const useCalculate = probeHook(
  "useCalculate",
  Hooks.useCalculate,
  Object.is,
  Hooks.useCountervaluesCache,
);
export const useCalculateCountervalueCallback = probeHook(
  "useCalculateCountervalueCallback",
  Hooks.useCalculateCountervalueCallback,
  Object.is,
  Hooks.useCountervaluesCache,
);
export const useSendAmount = probeHook(
  "useSendAmount",
  Hooks.useSendAmount,
  sameSendAmount,
  Hooks.useCountervaluesCache,
);
"""
write(f"{PKG}/src/index.ts", s)

# 3. The reducer mounted at `countervalues`: sees both slices' actions.
p = f"{PKG}/src/state/reducer.ts"
rep(p, 'import { combineReducers } from "@reduxjs/toolkit";\n',
    'import { combineReducers } from "@reduxjs/toolkit";\n'
    'import {\n  probeAction,\n  probeSelector,\n  probeStateChange,\n} from "../utils/internals/renderProbe";\n')
rep(p, """export const countervaluesReducer = combineReducers({
  rates: countervaluesRatesSlice.reducer,
  sync: countervaluesSyncSlice.reducer,
});
""", """const combinedCountervaluesReducer = combineReducers({
  rates: countervaluesRatesSlice.reducer,
  sync: countervaluesSyncSlice.reducer,
});

// MEASUREMENT BUILD ONLY, NEVER MERGE.
export const countervaluesReducer: typeof combinedCountervaluesReducer = (state, action) => {
  probeAction(state, action);
  const next = combinedCountervaluesReducer(state, action);
  probeStateChange(state, next, action);
  return next;
};
""")
rep(p, """export function countervaluesStateSelector(s: RootState): CounterValuesState {
  return s.countervalues.rates;
}
/** The sync selectors, read from the root state. */
export const {
  selectPending: countervaluesSyncPendingSelector,
  selectError: countervaluesSyncErrorSelector,
  selectIsPolling: countervaluesSyncIsPollingSelector,
} = countervaluesSyncSlice.getSelectors((s: RootState) => s.countervalues.sync);
""", """function readRates(s: RootState): CounterValuesState {
  return s.countervalues.rates;
}
const syncSelectors = countervaluesSyncSlice.getSelectors((s: RootState) => s.countervalues.sync);

// MEASUREMENT BUILD ONLY, NEVER MERGE. Timed selectors.
export const countervaluesStateSelector = probeSelector("countervaluesStateSelector", readRates);
/** The rates' cache alone: what the conversions read. */
export const countervaluesCacheSelector = probeSelector(
  "countervaluesCacheSelector",
  (s: RootState): CounterValuesState["cache"] => s.countervalues.rates.cache,
);
/** The sync selectors, read from the root state. */
export const countervaluesSyncPendingSelector = probeSelector(
  "countervaluesSyncPendingSelector",
  syncSelectors.selectPending,
);
export const countervaluesSyncErrorSelector = probeSelector(
  "countervaluesSyncErrorSelector",
  syncSelectors.selectError,
);
export const countervaluesSyncIsPollingSelector = probeSelector(
  "countervaluesSyncIsPollingSelector",
  syncSelectors.selectIsPolling,
);
""")

# 4. The loop.
p = f"{PKG}/src/state/internals/middleware.ts"
rep(p, 'import { log } from "../../utils/internals/logger";\n',
    'import { log } from "../../utils/internals/logger";\n'
    "import {\n  markLoopStart,\n  probeLoad,\n  probeRates,\n  probeRestore,\n  probeSelector,\n  probeSettings,\n  probeTimed,\n"
    '} from "../../utils/internals/renderProbe";\n')
rep(p, "  context.dispatch(setCountervaluesState(importCountervalues(savedState, settings)));\n",
    "  const restored = importCountervalues(savedState, settings);\n"
    "  probeRestore(savedState, restored);\n"
    "  context.dispatch(setCountervaluesState(restored));\n")
rep(p, "  const selectSettings = settings ? () => settings : config.createSettingsSelector();\n",
    "  const selectSettings = probeSelector(\n    \"settingsSelector\",\n"
    "    settings ? () => settings : config.createSettingsSelector(),\n  );\n")
rep(p, '    tryStep("reconcile", () => reconcileSessionWithStore(context, session));\n',
    '    tryStep("reconcile", () =>\n      probeTimed("reconcileTick", () => reconcileSessionWithStore(context, session)),\n    );\n')
# Step 2: persistence timed apart from the rest of the tick, and its export and write apart again.
rep(p, "  syncPollingTimer(context, session);\n  persistNewRates(context, session);\n}\n",
    "  syncPollingTimer(context, session);\n"
    '  probeTimed("persistNewRates", () => persistNewRates(context, session));\n}\n')
rep(p, "  persist(exportCountervalues(state, readSettings(context, session).trackingPairs));\n",
    '  probeTimed("persistExportAndWrite", () =>\n'
    "    persist(exportCountervalues(state, readSettings(context, session).trackingPairs)),\n  );\n")
rep(p, "  const rates = config.createRates(dispatch);\n",
    "  const rates = probeRates(config.createRates(dispatch));\n")
rep(p, """  session.lastSupportedSettings = readSupportedSettings(context, session);
  context.dispatch(countervaluesLoadRequested());
""", """  markLoopStart();
  session.lastSupportedSettings = readSupportedSettings(context, session);
  probeSettings(session.lastSupportedSettings);
  context.dispatch(countervaluesLoadRequested());
""")
rep(p, """  const settings = readSupportedSettings(context, session);
  if (settings !== session.lastSupportedSettings) {
""", """  const settings = readSupportedSettings(context, session);
  probeSettings(settings);
  if (settings !== session.lastSupportedSettings) {
""")
rep(p, """  loadCountervalues(currentState, settings, {
    rates,
    batchStrategySolver: {
      shouldBatchCurrencyFrom: currency =>
        shouldBatchCurrency(currency, supportedIds, settings.marketCapBatchingAfterRank),
    },
    granularitiesRates: settings.granularitiesRates,
    log,
  }).then(
""", """  probeLoad(settings, () =>
    loadCountervalues(currentState, settings, {
      rates,
      batchStrategySolver: {
        shouldBatchCurrencyFrom: currency =>
          shouldBatchCurrency(currency, supportedIds, settings.marketCapBatchingAfterRank),
      },
      granularitiesRates: settings.granularitiesRates,
      log,
    }),
  ).then(
""")

# 5. App roots: one <Profiler> around each whole app.
p = "apps/ledger-live-desktop/src/renderer/ReactRoot.tsx"
rep(p, 'import App from "./App";\n',
    'import { CountervaluesProbeProfiler } from "@features/platform-market-countervalues";\n'
    'import App from "./App";\n')
rep(p, "    return error ? String(error) : <App store={store} />;", """    return error ? (
      String(error)
    ) : (
      <CountervaluesProbeProfiler>
        <App store={store} />
      </CountervaluesProbeProfiler>
    );""")
p = "apps/ledger-live-mobile/src/index.tsx"
rep(p, 'import LedgerStoreProvider from "~/context/LedgerStore";\n',
    'import LedgerStoreProvider from "~/context/LedgerStore";\n'
    'import { CountervaluesProbeProfiler } from "@features/platform-market-countervalues";\n')
rep(p, """    return (
      <LedgerStoreProvider onInitFinished={this.onInitFinished} store={store}>""", """    return (
      <CountervaluesProbeProfiler>
      <LedgerStoreProvider onInitFinished={this.onInitFinished} store={store}>""")
rep(p, """      </LedgerStoreProvider>
    );""", """      </LedgerStoreProvider>
      </CountervaluesProbeProfiler>
    );""")

# 6. React profiling builds: the probe-head hunks, applied on top of the current files.
patch = git("diff", "e2e7d2bd2c6", PROBE_HEAD, "--",
            "apps/ledger-live-desktop/tools/rspack/rspack.renderer.ts",
            "apps/ledger-live-mobile/rspack.config.mjs")
git("apply", "-", stdin=patch)
# 7. Step 2, prototype A, in the entity: applyRatePatches keeps what a load left as it was. Off
# unless the probe turns it on for a load (PROTOTYPE_MODE).
p = "domain/entity/market-countervalues/src/logic.ts"
rep(p, "export function applyRatePatches(\n", "function applyRatePatchesCopying(\n")
rep(p, "\nfunction generateCache(\n", """
// MEASUREMENT BUILD ONLY, NEVER MERGE. Prototype A: a pair whose values a load leaves as they were
// keeps its Map and, unless holes are checked, its cache entry; when no pair changed, `data` and
// `cache` keep their identity too. Off unless setKeepUnchangedRates turns it on.
let keepUnchangedRates = false;

export function setKeepUnchangedRates(on: boolean): void {
  keepUnchangedRates = on;
}

export function applyRatePatches(
  previous: CounterValuesState,
  next: Pick<CounterValuesState, "data" | "cache" | "status">,
  patches: Array<Record<string, Record<string, unknown>>>,
  settings: CountervaluesSettings,
): CounterValuesState {
  return keepUnchangedRates
    ? applyRatePatchesKeepingUnchanged(previous, next, patches, settings)
    : applyRatePatchesCopying(previous, next, patches, settings);
}

function sameEntries<T>(a: Record<string, T>, b: Record<string, T>): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => a[key] === b[key]);
}

function applyRatePatchesKeepingUnchanged(
  previous: CounterValuesState,
  next: Pick<CounterValuesState, "data" | "cache" | "status">,
  patches: Array<Record<string, Record<string, unknown>>>,
  settings: CountervaluesSettings,
): CounterValuesState {
  const data = { ...next.data };
  const cache = { ...next.cache };
  const { status } = next;
  const touched = new Set<string>();
  const copied = new Set<string>();
  for (const patch of patches) {
    for (const key of Object.keys(patch)) {
      touched.add(key);
      for (const [k, v] of Object.entries(patch[key])) {
        if (typeof v !== "number") continue;
        if (!copied.has(key)) {
          if (data[key]?.has(k) && Object.is(data[key].get(k), v)) continue;
          data[key] = new Map(data[key]);
          copied.add(key);
        }
        data[key].set(k, v);
      }
      // A new pair gets a Map even from an empty patch, as before.
      if (!data[key]) {
        data[key] = new Map();
        copied.add(key);
      }
    }
  }

  const checkHolesOnNextLoad = previous.checkHolesOnNextLoad === true;
  for (const pair of touched) {
    const checkHoles = checkHolesOnNextLoad || !status[pair];
    if (!copied.has(pair) && !checkHoles && cache[pair]) continue;
    const previousStats = previous.cache[pair]?.stats;
    cache[pair] = generateCache(pair, data[pair], settings, checkHoles, previousStats);
  }

  return {
    data: sameEntries(data, previous.data) ? previous.data : data,
    cache: sameEntries(cache, previous.cache) ? previous.cache : cache,
    status,
    checkHolesOnNextLoad: false,
  };
}

function generateCache(
""")

# 8. Step 2, prototype B: the conversions take the cache alone, and a hook returns a view of it that
# changes only when the cache does.
rep(p, "export function lenseRateMap(\n  state: CounterValuesState,",
    "// MEASUREMENT BUILD ONLY, NEVER MERGE. Prototype B: what the conversions read.\n"
    'export type CounterValuesCacheView = Pick<CounterValuesState, "cache">;\n\n'
    "export function lenseRateMap(\n  state: CounterValuesCacheView,")
for fn in ("historyKey", "calculate", "calculateMany"):
    rep(p, f"export function {fn}(\n  state: CounterValuesState,",
        f"export function {fn}(\n  state: CounterValuesCacheView,")

p = f"{PKG}/src/hooks/countervaluesHooks.ts"
rep(p, "  type CounterValuesState,\n} from \"@domain/entity-market-countervalues\";",
    "  type CounterValuesCacheView,\n  type CounterValuesState,\n} from \"@domain/entity-market-countervalues\";")
rep(p, "import {\n  countervaluesStateSelector,", "import {\n  countervaluesCacheSelector,\n  countervaluesStateSelector,")
rep(p, """/** The countervalues polling controls.""", """/**
 * MEASUREMENT BUILD ONLY, NEVER MERGE. The rates the conversions read: a new object only when the
 * cache changes, not when a load changes the status alone.
 */
export function useCountervaluesCache(): CounterValuesCacheView {
  const cache = useSelector(countervaluesCacheSelector);
  return useMemo(() => ({ cache }), [cache]);
}

/** The countervalues polling controls.""")
s = read(p)
assert s.count("  const state = useCountervaluesState();\n") == 3
write(p, s.replace("  const state = useCountervaluesState();\n", "  const state = useCountervaluesCache();\n"))

# 9. Step 2, Portfolio values per load: each asset row's raw countervalue and the string it shows,
# the distribution they come from, and the header total.
p = "libs/ledger-live-common/src/portfolio/useAssetDistribution.ts"
rep(p, """    return buildAssetDistribution(accounts, cvState, to, assetsData, {
      showEmptyAccounts: !!displayOpts.showEmptyAccounts,
      hideEmptyTokenAccount: !!displayOpts.hideEmptyTokenAccount,
    });
""", """    const built = buildAssetDistribution(accounts, cvState, to, assetsData, {
      showEmptyAccounts: !!displayOpts.showEmptyAccounts,
      hideEmptyTokenAccount: !!displayOpts.hideEmptyTokenAccount,
    });
    // MEASUREMENT BUILD ONLY, NEVER MERGE.
    probeAssetValues("distribution", {
      sum: built.sum,
      rows: built.list.map(item => [item.currency.id, item.countervalue]),
    });
    return built;
""")
rep(p, 'import { useCountervaluesState } from "@features/platform-market-countervalues";\n',
    'import {\n  probeAssetValues,\n  useCountervaluesState,\n} from "@features/platform-market-countervalues";\n')

p = "apps/ledger-live-mobile/src/mvvm/components/AssetListItem/usePrecomputedAssetListData.ts"
rep(p, 'import { useCountervaluesState } from "@features/platform-market-countervalues";\n',
    'import {\n  probeAssetValues,\n  useCountervaluesState,\n  useProbeInstance,\n} from "@features/platform-market-countervalues";\n')
rep(p, """  const cacheRef = useRef(new Map<string, AssetListItemViewModelResult>());
""", """  const cacheRef = useRef(new Map<string, AssetListItemViewModelResult>());
  const probeInstance = useProbeInstance();
  // MEASUREMENT BUILD ONLY, NEVER MERGE. Whether the rows still read an older (throttled) state.
  probeAssetValues(`rows-throttle#${probeInstance}`, { behind: cvState !== rawCvState });
""")
rep(p, """    if (!changed) return prev;
    cacheRef.current = next;
    return next;
  }, [assets, cvState, counterValueCurrency, range, locale, discreet]);""", """    // MEASUREMENT BUILD ONLY, NEVER MERGE. rows: [currency id, raw countervalue (from the
    // distribution or computed here), string shown]; the raw value is recomputed for the log only.
    probeAssetValues(`rows#${probeInstance}`, {
      discreet,
      rows: assets.map(asset => [
        asset.currency.id,
        getCounterValue(
          asset,
          BigNumber(asset.amount),
          state.cvState,
          state.counterValueCurrency,
        ),
        (changed ? next : prev).get(asset.currency.id)?.formattedCounterValue ?? null,
      ]),
    });
    if (!changed) return prev;
    cacheRef.current = next;
    return next;
  }, [assets, cvState, counterValueCurrency, range, locale, discreet, probeInstance]);""")

p = ("apps/ledger-live-mobile/src/mvvm/features/Portfolio/components/PortfolioBalanceSection/"
     "usePortfolioBalanceSectionViewModel.ts")
rep(p, 'import { useMemo } from "react";\n',
    'import { useMemo } from "react";\n'
    'import { probeAssetValues } from "@features/platform-market-countervalues";\n')
rep(p, """    cvPending: isCvPending,
  });
""", """    cvPending: isCvPending,
  });
  // MEASUREMENT BUILD ONLY, NEVER MERGE. The header total: computed, and shown.
  probeAssetValues("header", { latestBalance, displayedBalance, syncPhase });
""")

# 10. Step 2, prototype B: the consumers the mobile app runs move to the cache view. All of them
# read the state only through calculate, calculateMany, lenseRateMap or historyKey. Desktop ones are
# left as they are: not in the run.
def rename_all(p, old, new, expected):
    s = read(p)
    assert s.count(old) == expected, (p, old, s.count(old))
    write(p, s.replace(old, new))


MOBILE = "apps/ledger-live-mobile/src/mvvm"
for p, n in (
    ("libs/ledger-live-common/src/portfolio/portfolioReact.tsx", 6),
    ("libs/ledger-live-common/src/portfolio/useAssetDistribution.ts", 2),
    (f"{MOBILE}/components/AssetListItem/usePrecomputedAssetListData.ts", 3),
    (f"{MOBILE}/features/CryptoAddresses/screens/CryptoAddressesScreen/useCryptoAddressesViewModel.ts", 2),
    (f"{MOBILE}/features/ModularDrawer/hooks/useBalanceDeps.ts", 2),
    (f"{MOBILE}/features/ModularDrawer/hooks/useDetailedAccounts.ts", 2),
    (f"{MOBILE}/features/Accounts/hooks/useAccountsListViewModel.ts", 2),
    (f"{MOBILE}/features/Perps/screens/PerpsDeposit/usePerpsDepositViewModel.ts", 2),
):
    rename_all(p, "useCountervaluesState", "useCountervaluesCache", n)
# Through the app's own full-state hook until now: the package's view, which the probe counts.
for p in (
    f"{MOBILE}/features/AssetDetail/screens/AssetDetail/components/PnLSection/useAssetPnlViewModel.ts",
    f"{MOBILE}/features/AssetDetail/screens/AssetDetail/components/BalanceGraph/useBalanceGraphViewModel.ts",
    f"{MOBILE}/features/Analytics/screens/AnalyticsMain/components/ChartSection/useChartSectionViewModel.ts",
    f"{MOBILE}/features/Analytics/screens/AnalyticsMain/components/PnlSection/usePnlSectionViewModel.ts",
):
    rep(p, 'import { useCountervaluesState } from "~/reducers/countervalues";\n',
        'import { useCountervaluesCache } from "@features/platform-market-countervalues";\n')
    rename_all(p, "useCountervaluesState()", "useCountervaluesCache()", 1)
for p, n in (
    ("libs/ledger-live-common/src/portfolio/portfolio.ts", 7),
    ("libs/ledger-live-common/src/modularDrawer/utils/type.ts", 2),
    ("libs/ledger-live-common/src/modularDrawer/utils/getBalanceAndFiatValueByAssets.ts", 2),
    ("libs/ledger-live-common/src/modularDrawer/hooks/useDetailedAccountsCore.ts", 2),
):
    rename_all(p, "CounterValuesState", "CounterValuesCacheView", n)

print("applied probe on", sha, "prototype", prototype_mode)
