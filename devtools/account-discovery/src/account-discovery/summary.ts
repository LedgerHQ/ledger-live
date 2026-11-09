import type { AccountDiscoveryState } from "../types";

export function formatDuration(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** What the scan found, what it cost, how long it took. */
export function summaryLine(state: AccountDiscoveryState): string {
  const used = state.rows.filter(row => row.used).length;
  const { derivations, existenceChecks } = state.counters;
  const time = state.elapsedMs === undefined ? "" : ` · ${formatDuration(state.elapsedMs)}`;
  return `${plural(used, "used account")} · ${plural(derivations, "derivation")}, ${plural(existenceChecks, "existence check")}${time}`;
}

export function statusLine(state: AccountDiscoveryState): string {
  if (state.status === "idle") return "Pick a currency and scan.";
  if (state.status === "error") return state.error ?? "The scan failed.";
  const prefix = { scanning: "Scanning… ", stopped: "Stopped · ", done: "Done · " }[state.status];
  return `${prefix}${summaryLine(state)}`;
}
