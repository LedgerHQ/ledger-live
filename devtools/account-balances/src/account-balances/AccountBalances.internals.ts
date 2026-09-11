import type { AccountBalanceRow } from "../types";

/** Seconds since a timestamp, or `undefined` when there is nothing to age. */
export function ageSeconds(at: string | undefined): number | undefined {
  if (at === undefined) return undefined;
  const ms = new Date(at).getTime();
  return Number.isFinite(ms) ? Math.max(0, Math.round((Date.now() - ms) / 1000)) : undefined;
}

/** One line saying who answered and how long ago, or the error if the read failed. */
export function statusLine(row: AccountBalanceRow): string {
  if (row.status.error) return row.status.error;
  const age = ageSeconds(row.balance?.at);
  const source = row.status.sourceId
    ? `served by ${row.status.sourceId}`
    : "not read by the layer yet";
  return age === undefined ? source : `${source} · observed ${age}s ago`;
}
