import type { AccountBalanceRow, AmountUnit } from "../types";

const MAX_DECIMALS = 8;

/**
 * Drop trailing zeros. A scan rather than `/0+$/`, whose backtracking is quadratic on an all-zero
 * fraction — the common case here, since most balances have far fewer decimals than the magnitude.
 */
function trimTrailingZeros(fraction: string): string {
  let end = fraction.length;
  while (end > 0 && fraction[end - 1] === "0") end--;
  return fraction.slice(0, end);
}

/**
 * Render a smallest-unit amount the way the app would.
 *
 * Deliberately local and dependency-free: the tool needs a readable number, not the app's full
 * locale-aware formatter, and pulling one in would tie a devtool to the wallet's currency stack.
 * Falls back to the raw value when the host could not resolve the unit, or when the value is not a
 * plain integer — a devtool must show what the layer actually holds, never a silent `NaN`.
 */
export function formatAmount(value: string, unit?: AmountUnit): string {
  if (!unit || !/^\d+$/.test(value)) return value;
  const padded = value.padStart(unit.magnitude + 1, "0");
  const whole = padded.slice(0, padded.length - unit.magnitude) || "0";
  const fraction = unit.magnitude === 0 ? "" : padded.slice(padded.length - unit.magnitude);
  const decimals = trimTrailingZeros(fraction.slice(0, MAX_DECIMALS));
  const fractionPart = decimals ? `.${decimals}` : "";
  return `${Number(whole).toLocaleString("en-US")}${fractionPart} ${unit.code}`;
}

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
