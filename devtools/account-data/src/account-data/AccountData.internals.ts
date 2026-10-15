import type { AmountUnit, ReadStatus } from "../types";

/** Seconds since a time in ms, or `undefined` when there is nothing to age. */
export function ageSeconds(at: number | undefined, now = Date.now()): number | undefined {
  return at === undefined ? undefined : Math.max(0, Math.round((now - at) / 1000));
}

/** Who answered and how long ago, or the error of the last read. */
export function statusLine(status: ReadStatus, now = Date.now()): string {
  if (status.error) return status.error;
  if (status.pending) return "reading…";
  if (!status.sourceId) return "not read yet";
  const age = ageSeconds(status.readAt, now);
  return age === undefined
    ? `served by ${status.sourceId}`
    : `served by ${status.sourceId} · ${age}s ago`;
}

const MAX_DECIMALS = 8;

function trimTrailingZeros(fraction: string): string {
  let end = fraction.length;
  while (end > 0 && fraction[end - 1] === "0") end--;
  return fraction.slice(0, end);
}

// Not through `Number`: a smallest-unit amount routinely exceeds MAX_SAFE_INTEGER on EVM chains.
function groupThousands(digits: string): string {
  let grouped = "";
  for (let end = digits.length; end > 0; end -= 3) {
    const start = Math.max(0, end - 3);
    grouped = grouped ? `${digits.slice(start, end)},${grouped}` : digits.slice(start, end);
  }
  return grouped || "0";
}

/** A smallest-unit amount with its unit, the raw value without one; dust shows as dust, not zero. */
export function formatAmount(value: string, unit?: AmountUnit): string {
  if (!unit || !Number.isInteger(unit.magnitude) || unit.magnitude < 0 || !/^\d+$/.test(value)) {
    return value;
  }
  const padded = value.padStart(unit.magnitude + 1, "0");
  const whole = padded.slice(0, padded.length - unit.magnitude) || "0";
  const fraction = unit.magnitude === 0 ? "" : padded.slice(padded.length - unit.magnitude);
  const decimals = trimTrailingZeros(fraction.slice(0, MAX_DECIMALS));
  if (!decimals && groupThousands(whole) === "0" && /[1-9]/.test(value)) {
    return `<0.${"0".repeat(MAX_DECIMALS - 1)}1 ${unit.code}`;
  }
  return `${groupThousands(whole)}${decimals ? `.${decimals}` : ""} ${unit.code}`;
}

/** A fiat value in the fiat's smallest unit, as the fiat shows it. */
export function formatValue(value: number | undefined, fiat: AmountUnit | undefined): string {
  if (value === undefined || !fiat) return "—";
  return formatAmount(Math.max(0, Math.round(value)).toFixed(0), fiat);
}

/** `+7.87%`, `-0.12%`, or `—` without a trend. */
export function formatTrend(trend: number | undefined): string {
  if (trend === undefined || !Number.isFinite(trend)) return "—";
  const percent = (trend * 100).toFixed(2);
  return trend > 0 ? `+${percent}%` : `${percent}%`;
}
