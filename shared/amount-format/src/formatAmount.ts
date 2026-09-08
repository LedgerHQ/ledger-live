/** Enough of a currency unit to render an amount: how many decimals, and what to call it. */
export interface AmountUnit {
  readonly code: string;
  readonly magnitude: number;
}

const MAX_DECIMALS = 8;

function trimTrailingZeros(fraction: string): string {
  let end = fraction.length;
  while (end > 0 && fraction[end - 1] === "0") end--;
  return fraction.slice(0, end);
}

/**
 * Group a digit string in threes, without going through `Number`: an amount in smallest units
 * routinely exceeds `Number.MAX_SAFE_INTEGER` on any EVM chain.
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
 * Render a smallest-unit amount, falling back to the raw value when the unit is unknown or the value
 * is not a plain integer. Dust below {@link MAX_DECIMALS} renders as `<0.00000001 CODE`, never as
 * `0 CODE`: holding nothing and holding dust are different answers.
 */
const MAX_MAGNITUDE = 64;

/** A magnitude a caller could have made up: negative, fractional, or large enough to blow up `padStart`. */
const usable = (unit: AmountUnit): boolean =>
  Number.isInteger(unit.magnitude) && unit.magnitude >= 0 && unit.magnitude <= MAX_MAGNITUDE;

export function formatAmount(value: string, unit?: AmountUnit): string {
  if (!unit || !usable(unit) || !/^\d+$/.test(value)) return value;
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
