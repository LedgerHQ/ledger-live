/** Comma, plain space, non-breaking space and narrow non-breaking space are all used as
 * thousands separators depending on locale and surface. */
const GROUPING = "[,   ]";
const GROUPING_SEPARATOR = `${GROUPING}?`;

/**
 * Matches an amount as an exact digit sequence, tolerating thousands separators in the
 * displayed value but not a different number:
 *
 *   "123456"      matches "123,456 XRP" and "123456 XRP", not "1234567 XRP"
 *   "1"           matches "1 ADA" and "1.00 ADA", not "1.17 ADA" or "1,000 ADA"
 *   "1000"        matches "1,000 ADA", not "1,000,000 ADA"
 *   "0.123456789" matches "0.123456789 WGNK", not "0.1234567890" or "0.12345678"
 *
 * The digit-boundary guards matter: a plain substring check accepts "0.1234567890" for
 * "0.123456789" and so cannot detect a differently-rounded amount.
 *
 * Used by the desktop amount assertion; intended to be shared with the mobile one
 * (LIVE-37070) so the two cannot drift.
 */
export function exactAmountPattern(amount: string): RegExp {
  const [integerPart, decimalPart] = amount.split(".");
  const groupedInteger = integerPart.split("").join(GROUPING_SEPARATOR);
  // With decimals: reject a trailing digit. Without: reject a trailing "." too, or "1"
  // would match "1.17" — `(?!\d)` alone is satisfied by the decimal point. A zero-padded
  // integer ("1" shown as "1.00000000") is the same number, so it stays allowed.
  const tail = decimalPart
    ? String.raw`\.${decimalPart}(?!\d)`
    : String.raw`(?:\.0+)?(?![\d.]|${GROUPING}\d)`;
  return new RegExp(String.raw`(?<!\d)${groupedInteger}${tail}`);
}
