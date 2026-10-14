#!/usr/bin/env node
// MEASUREMENT BUILD ONLY, NEVER MERGE.
// Reads the `load-effect` events of a probe log (logcat, terminal or export) and answers, per
// stored load: how many pairs changed, whether the load changed nothing, and which hook renders
// the two candidate fixes would avoid.
// - fix 1, skip storing a load that changed nothing: avoids every rate-driven render of that load;
// - fix 2, select the computed number instead of the whole state: avoids the rate-driven renders
//   of useCalculate and useSendAmount whose value did not change. An upper bound: a component
//   re-renders anyway when another of its hooks, or its parent, asks for it.
// Usage: node cv-probe-loads.mjs <log> [--from <elapsedMs>] [--to <elapsedMs>] [--loads]
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith("--") && !/^\d+$/.test(a));
const opt = name => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : Number(args[i + 1]);
};
const from = opt("--from") ?? -Infinity;
const to = opt("--to") ?? Infinity;
const perLoad = args.includes("--loads");
if (!file) {
  console.error("usage: node cv-probe-loads.mjs <log> [--from ms] [--to ms] [--loads]");
  process.exit(1);
}

const effects = [];
let summary = null;
for (const line of readFileSync(file, "utf8").split("\n")) {
  const atSummary = line.indexOf("cv-probe {");
  if (atSummary !== -1) {
    try {
      const sm = JSON.parse(line.slice(atSummary + "cv-probe ".length));
      if (sm.elapsedMs <= to) summary = sm;
    } catch {
      // a truncated logcat line
    }
    continue;
  }
  const at = line.indexOf("cv-probe-event {");
  if (at === -1) continue;
  let e;
  try {
    e = JSON.parse(line.slice(at + "cv-probe-event ".length));
  } catch {
    continue;
  }
  if (e.event === "load-effect" && e.elapsedMs >= from && e.elapsedMs <= to) effects.push(e);
}

const stored = effects.filter(e => e.stored);
if (stored.length === 0) {
  console.error("no stored load-effect event in range: not a probe build with load effects?");
  process.exit(2);
}
// The first loads of a session add pairs or clear checkHolesOnNextLoad: kept apart.
const steady = stored.filter(
  e => e.pairsAdded === 0 && e.pairsRemoved === 0 && !e.checkHolesChanged,
);

const RATE_HOOKS = [
  "useCountervaluesState",
  "useCalculate",
  "useCalculateCountervalueCallback",
  "useSendAmount",
];
const VALUE_HOOKS = ["useCalculate", "useSendAmount"];

const sum = (list, f) => list.reduce((n, e) => n + (f(e) || 0), 0);
const pct = (n, d) => (d === 0 ? "n/a" : `${((100 * n) / d).toFixed(1)}%`);
const hook = (e, name, key) => e.hooks?.[name]?.[key] ?? 0;
const changedPairs = e => e.dataReplaced - e.dataReplacedSameContent + e.pairsAdded;

function report(label, list) {
  const pairs = sum(list, e => e.pairs);
  const noop = list.filter(e => e.noop);
  const noopExceptStatus = list.filter(e => e.noopExceptStatus);
  const driven = name => sum(list, e => hook(e, name, "storeDriven"));
  const totalDriven = sum(RATE_HOOKS, name => driven(name));
  const fix1 = sum(noop, e => sum(RATE_HOOKS, name => hook(e, name, "storeDriven")));
  const fix1Status = sum(noopExceptStatus, e =>
    sum(RATE_HOOKS, name => hook(e, name, "storeDriven")),
  );
  const fix2 = sum(list, e => sum(VALUE_HOOKS, name => hook(e, name, "storeDrivenSame")));

  console.log(`\n## ${label}: ${list.length} stored loads`);
  console.log(`state object replaced: ${list.filter(e => e.stateReplaced).length}/${list.length}`);
  console.log("\nPairs per load (share of all tracked pairs, summed over loads)");
  console.log(
    `  latest moved            ${pct(
      sum(list, e => e.latestMoved),
      pairs,
    )}`,
  );
  console.log(
    `  history changed         ${pct(
      sum(list, e => e.historyChanged),
      pairs,
    )}`,
  );
  console.log(`  changed by content      ${pct(sum(list, changedPairs), pairs)}`);
  console.log(
    `  data object replaced    ${pct(
      sum(list, e => e.dataReplaced),
      pairs,
    )}`,
  );
  console.log(
    `    of which same content ${pct(
      sum(list, e => e.dataReplacedSameContent),
      pairs,
    )}`,
  );
  console.log(
    `  cache object replaced   ${pct(
      sum(list, e => e.cacheReplaced),
      pairs,
    )}`,
  );
  console.log(
    `\nLoads that changed nothing: ${noop.length}/${list.length} (${pct(noop.length, list.length)})`,
  );
  console.log(
    `  nothing but status:      ${noopExceptStatus.length}/${list.length} (${pct(noopExceptStatus.length, list.length)})`,
  );
  console.log(
    `  status changed:          ${list.filter(e => e.statusChanged).length}/${list.length}`,
  );

  console.log(
    "\nRate-driven hook renders (storeDriven / of which same value), and time in the hook",
  );
  for (const name of RATE_HOOKS) {
    const d = driven(name);
    if (d === 0) continue;
    const same = sum(list, e => hook(e, name, "storeDrivenSame"));
    const ms = sum(list, e => hook(e, name, "ms"));
    console.log(
      `  ${name.padEnd(34)} ${String(d).padStart(6)} / ${String(same).padStart(6)}   ${ms.toFixed(1)} ms`,
    );
  }
  console.log(`  total ${totalDriven}`);
  const memoMiss = sum(list, e => hook(e, "useCalculate", "newArgSameRates"));
  console.log(`  useCalculate memo misses in these windows (same rates, new query): ${memoMiss}`);
  console.log(
    `\nWindows after each store (${list[0].windowMs} ms): ${sum(list, e => e.commits)} commits, ${sum(list, e => e.renderMs).toFixed(0)} ms render`,
  );
  console.log(
    `  in no-op load windows: ${sum(noop, e => e.commits)} commits, ${sum(noop, e => e.renderMs).toFixed(0)} ms render`,
  );

  console.log("\nWhat each fix would avoid (rate-driven hook renders)");
  console.log(
    `  fix 1, skip a load that changed nothing:          ${fix1} (${pct(fix1, totalDriven)})`,
  );
  console.log(
    `  fix 1 if status were kept out of the rendered state: ${fix1Status} (${pct(fix1Status, totalDriven)})`,
  );
  console.log(
    `  fix 2, select the computed value (upper bound):   ${fix2} (${pct(fix2, totalDriven)})`,
  );
  // The two overlap on no-op loads, where fix 2 also skips the same-value renders.
  const both =
    fix1 +
    sum(
      list.filter(e => !e.noop),
      e => sum(VALUE_HOOKS, name => hook(e, name, "storeDrivenSame")),
    );
  console.log(
    `  both (no double count):                            ${both} (${pct(both, totalDriven)})`,
  );
}

report("All stored loads", stored);
if (steady.length !== stored.length)
  report("Steady state (no pair added, no first hole check)", steady);
const dropped = effects.length - stored.length;
if (dropped) console.log(`\n${dropped} load(s) resolved without being stored`);

if (perLoad) {
  console.log(
    "\nload  elapsed  pairs latest histo replaced(same) cache status noop  stateDriven calcDriven(same) commits renderMs",
  );
  for (const e of stored) {
    console.log(
      [
        String(e.load).padStart(4),
        String(Math.round(e.elapsedMs / 1000)).padStart(7) + "s",
        String(e.pairs).padStart(5),
        String(e.latestMoved).padStart(6),
        String(e.historyChanged).padStart(5),
        `${e.dataReplaced}(${e.dataReplacedSameContent})`.padStart(14),
        String(e.cacheReplaced).padStart(5),
        String(e.statusChanged).padStart(6),
        String(e.noop).padStart(5),
        String(hook(e, "useCountervaluesState", "storeDriven")).padStart(12),
        `${hook(e, "useCalculate", "storeDriven")}(${hook(e, "useCalculate", "storeDrivenSame")})`.padStart(
          16,
        ),
        String(e.commits).padStart(7),
        String(e.renderMs).padStart(8),
      ].join(" "),
    );
  }
}

// Cumulative since launch, from the last summary in range: which actions produced the state each
// hook-driven render read, and what the selectors cost.
if (summary?.drivenBy) {
  const isCountervalues = type => /^countervalues(Rates|Sync)\//.test(type);
  const isStoreSetup = type => type.startsWith("@@redux/");
  console.log(
    `\n## Attribution, launch to ${Math.round(summary.elapsedMs / 1000)} s (${summary.actions.total} actions)`,
  );
  for (const [hookName, byType] of Object.entries(summary.drivenBy)) {
    const total = Object.values(byType).reduce((n, v) => n + v, 0);
    const outside = Object.entries(byType).filter(([type]) => !isCountervalues(type));
    console.log(`  ${hookName}: ${total} hook-driven renders`);
    for (const [type, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
      const flag = isCountervalues(type)
        ? ""
        : isStoreSetup(type)
          ? "  (store setup)"
          : "  <-- FINDING";
      console.log(`    ${String(n).padStart(6)}  ${type}${flag}`);
    }
    if (outside.length === 0) console.log("    all after a countervalues action");
  }
  const changes = (label, byType) => {
    const other = Object.entries(byType).filter(([t]) => !isCountervalues(t) && !isStoreSetup(t));
    console.log(`  ${label}: ${JSON.stringify(byType)}${other.length ? "  <-- FINDING" : ""}`);
  };
  changes("rates replaced by", summary.ratesChangedBy);
  changes("sync replaced by", summary.syncChangedBy);
  console.log("\nSelector and reconcile cost (calls, ms incl. the timer itself, ms per call)");
  let totalMs = 0;
  for (const [name, t] of Object.entries(summary.timed)) {
    // The settings selector mostly runs inside a reconcile tick: not added twice.
    if (name !== "settingsSelector") totalMs += t.ms;
    console.log(
      `  ${name.padEnd(36)} ${String(t.calls).padStart(8)} ${t.ms.toFixed(1).padStart(9)} ms ${((t.ms / Math.max(t.calls, 1)) * 1000).toFixed(2).padStart(8)} us`,
    );
  }
  console.log(
    `  total ${totalMs.toFixed(1)} ms vs whole-app render ${summary.renderMs.toFixed(0)} ms (${pct(totalMs, summary.renderMs)})`,
  );
}
