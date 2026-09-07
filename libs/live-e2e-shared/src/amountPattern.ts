/** Comma, plain space, non-breaking space and narrow non-breaking space are all used as
 * thousands separators depending on locale and surface. */
const GROUPING_SEPARATOR = String.raw`[,   ]?`;

/**
 * Matches an amount as an exact digit sequence, tolerating thousands separators in the
 * displayed value but not a different number:
 *
 *   "123456"      matches "123,456 XRP" and "123456 XRP", not "1234567 XRP"
 *   "0.123456789" matches "0.123456789 WGNK", not "0.1234567890" or "0.12345678"
 *
 * The digit-boundary guards matter: a plain substring check accepts "0.1234567890" for
 * "0.123456789" and so cannot detect a differently-rounded amount.
 *
 * Shared by the desktop and mobile amount assertions — keep one copy so they cannot drift.
 */
export function exactAmountPattern(amount: string): RegExp {
  const [integerPart, decimalPart] = amount.split(".");
  const groupedInteger = integerPart.split("").join(GROUPING_SEPARATOR);
  const decimals = decimalPart ? String.raw`\.${decimalPart}` : "";
  return new RegExp(String.raw`(?<!\d)${groupedInteger}${decimals}(?!\d)`);
}
