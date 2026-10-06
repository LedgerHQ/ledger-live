import type { AccountDiscoveryState } from "../types";

export function formatDuration(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

/** One line on how the scan went: what it found, what it cost, how long it took. */
export function summaryLine(state: AccountDiscoveryState): string {
  const used = state.rows.filter(row => row.used).length;
  const { derivations, existenceChecks } = state.counters;
  const cost = `${derivations} derivation${derivations === 1 ? "" : "s"}, ${existenceChecks} existence check${existenceChecks === 1 ? "" : "s"}`;
  const found = `${used} used account${used === 1 ? "" : "s"}`;
  const time = state.elapsedMs === undefined ? "" : ` · ${formatDuration(state.elapsedMs)}`;
  return `${found} · ${cost}${time}`;
}

export function shorten(value: string, keep = 10): string {
  return value.length <= keep * 2 + 1 ? value : `${value.slice(0, keep)}…${value.slice(-keep)}`;
}
