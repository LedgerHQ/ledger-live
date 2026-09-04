import type { AccountOperationsRow, AmountUnit, ListedOperation } from "../types";

const MAX_DECIMALS = 8;

/**
 * Drop trailing zeros. A scan rather than `/0+$/`, whose backtracking is quadratic on an all-zero
 * fraction — the common case here, since most amounts have far fewer decimals than the magnitude.
 */
function trimTrailingZeros(fraction: string): string {
  let end = fraction.length;
  while (end > 0 && fraction[end - 1] === "0") end--;
  return fraction.slice(0, end);
}

/**
 * Group a digit string in threes, without going through `Number`.
 *
 * `toLocaleString` would be shorter and wrong: an amount is a smallest-unit integer that routinely
 * exceeds `Number.MAX_SAFE_INTEGER` on any EVM chain, so converting it would round the number the
 * devtool exists to show exactly.
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
 * A non-zero amount whose first significant digit falls past {@link MAX_DECIMALS} renders as
 * `<0.00000001 CODE` rather than `0 CODE`: dust and nothing are different answers.
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

/** `2026-01-31T12:00:00.000Z` → `2026-01-31 12:00`. Enough to order a list by eye. */
export function formatDate(iso: string): string {
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? iso.slice(0, 16).replace("T", " ") : iso;
}

/** Where the operation sits in a block, or that it has not reached one. */
export function blockLine(operation: ListedOperation): string {
  return operation.blockHeight === null ? "pending" : `block ${operation.blockHeight}`;
}

/**
 * The one line that says what this tool exists to show.
 *
 * `total` is `undefined` on a partial window because a paginated read cannot know it, and the label
 * has to say so rather than pass the loaded count off as the total.
 */
export function countLine(row: AccountOperationsRow): string {
  const loaded = `${row.operations.length} loaded`;
  if (row.total === undefined) return `${loaded} · total unknown, the window is partial`;
  if (row.complete) return `${loaded} · complete history`;
  return `${loaded} of ${row.total}`;
}

/** Who answered and what is left, or the error if the read failed. */
export function statusLine(row: AccountOperationsRow): string {
  if (row.status.error) return row.status.error;
  if (row.status.pending) return "reading…";
  if (!row.status.sourceId) return "not read yet";
  // Worth spelling out: on a source that cannot paginate there is no next page to ask for, so the
  // absence of "load more" is the design, not a limitation of the tool.
  const more = row.hasMore ? "more available" : "nothing more to load";
  return `served by ${row.status.sourceId} · ${more}`;
}
