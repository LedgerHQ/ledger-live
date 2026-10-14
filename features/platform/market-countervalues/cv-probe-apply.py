#!/usr/bin/env python3
# MEASUREMENT BUILD ONLY, NEVER MERGE.
# Applies the countervalues probe to a tree where the loop is the Redux middleware in
# state/internals/middleware.ts and the store slice is split into rates and sync.
# Usage: cv-probe-apply.py <repo> <sha the tree was cut from>
# Needs the commits e2e7d2bd2c6 and 742ca707c5f (origin/measure/countervalues-rerender-probe-head):
# the probe module, the parser and the React profiling hunks are taken from there.
import re
import subprocess
import sys

repo, sha = sys.argv[1:3]
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
write(f"{PKG}/src/utils/internals/renderProbe.ts", probe)
write(f"{PKG}/cv-probe-parse.mjs", git("show", f"{PROBE_HEAD}:{PKG}/cv-probe-parse.mjs"))

# 2. Barrel: counted hooks shadow the re-exported ones; the root profiler.
s = read(f"{PKG}/src/index.ts")
s += """
// MEASUREMENT BUILD ONLY, NEVER MERGE. These local exports shadow the hooks re-exported above, so
// every consumer of the package gets the counted version.
import * as Hooks from "./hooks/countervaluesHooks";
import { probeHook } from "./utils/internals/renderProbe";

export { CountervaluesProbeProfiler } from "./utils/internals/renderProbe";

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
);
export const useCountervaluesPolling = probeHook(
  "useCountervaluesPolling",
  Hooks.useCountervaluesPolling,
);
export const useCountervaluesLoadStatus = probeHook(
  "useCountervaluesLoadStatus",
  Hooks.useCountervaluesLoadStatus,
);
export const useCalculate = probeHook("useCalculate", Hooks.useCalculate);
export const useCalculateCountervalueCallback = probeHook(
  "useCalculateCountervalueCallback",
  Hooks.useCalculateCountervalueCallback,
);
export const useSendAmount = probeHook("useSendAmount", Hooks.useSendAmount, sameSendAmount);
"""
write(f"{PKG}/src/index.ts", s)

# 3. The reducer mounted at `countervalues`: sees both slices' actions.
p = f"{PKG}/src/state/reducer.ts"
rep(p, 'import { combineReducers } from "@reduxjs/toolkit";\n',
    'import { combineReducers } from "@reduxjs/toolkit";\n'
    'import { probeAction } from "../utils/internals/renderProbe";\n')
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
  return combinedCountervaluesReducer(state, action);
};
""")

# 4. The loop.
p = f"{PKG}/src/state/internals/middleware.ts"
rep(p, 'import { log } from "../../utils/internals/logger";\n',
    'import { log } from "../../utils/internals/logger";\n'
    "import {\n  markLoopStart,\n  probeLoad,\n  probeRates,\n  probeRestore,\n  probeSettings,\n"
    '} from "../../utils/internals/renderProbe";\n')
rep(p, "  context.dispatch(setCountervaluesState(importCountervalues(savedState, settings)));\n",
    "  const restored = importCountervalues(savedState, settings);\n"
    "  probeRestore(savedState, restored);\n"
    "  context.dispatch(setCountervaluesState(restored));\n")
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
print("applied probe on", sha)
