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
 * Group a digit string in threes, without going through `Number`.
 *
 * `toLocaleString` would be shorter and wrong: a balance is a smallest-unit integer that routinely
 * exceeds `Number.MAX_SAFE_INTEGER` (18 decimals on any EVM chain), so converting it would round the
 * amount the devtool exists to show exactly.
 */
function groupThousands(digits: string): string {
  let grouped = "";
  for (let end = digits.length; end > 0; end -= 3) {
    const start = Math.max(0, end - 3);
    grouped = grouped ? `${digits.slice(start, end)},${grouped}` : digits.slice(start, end);
  }
  return grouped || "0";
}

/**
 * Render a smallest-unit amount the way the app would.
 *
 * Deliberately local and dependency-free: the tool needs a readable number, not the app's full
 * locale-aware formatter, and pulling one in would tie a devtool to the wallet's currency stack.
 * Falls back to the raw value when the host could not resolve the unit, or when the value is not a
 * plain integer — a devtool must show what the layer actually holds, never a silent `NaN`.
 *
 * A non-zero amount whose first significant digit falls past {@link MAX_DECIMALS} renders as
 * `<0.00000001 CODE` rather than as `0 CODE`: 1 wei is dust, but "this account holds nothing" and
 * "this account holds dust" are different answers, and a tool built to make a balance read
 * trustworthy must not conflate them.
 */
export function formatAmount(value: string, unit?: AmountUnit): string {
  if (!unit || !/^\d+$/.test(value)) return value;
  const padded = value.padStart(unit.magnitude + 1, "0");
  const whole = padded.slice(0, padded.length - unit.magnitude) || "0";
  const fraction = unit.magnitude === 0 ? "" : padded.slice(padded.length - unit.magnitude);
  const decimals = trimTrailingZeros(fraction.slice(0, MAX_DECIMALS));
  if (!decimals && groupThousands(whole) === "0" && /[1-9]/.test(value)) {
    return `<0.${"0".repeat(MAX_DECIMALS - 1)}1 ${unit.code}`;
  }
  const fractionPart = decimals ? `.${decimals}` : "";
  return `${groupThousands(whole)}${fractionPart} ${unit.code}`;
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
