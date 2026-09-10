/** Comma, plain space, non-breaking space and narrow non-breaking space are all used as
 * thousands separators depending on locale and surface. */
const GROUPING = "[,   ]";
const GROUPING_SEPARATOR = `${GROUPING}?`;

/**
 * Matches an amount as an exact digit sequence, tolerating thousands separators in the
 * displayed value but never a different number:
 *
 *   "123456"      matches "123,456 XRP" and "123456 XRP", not "1234567 XRP"
 *   "1"           matches "1 ADA" and "1.00 ADA", not "1.17 ADA", "1,000 ADA" or "0.1 ADA"
 *   "1000"        matches "1,000 ADA", not "1,000,000 ADA"
 *   "123"         matches "123 ADA", not "1,123 ADA"
 *   "0.123456789" matches "0.123456789 WGNK", not "0.1234567890" or "0.12345678"
 *
 * Zero-padding is tolerated on an integer ("1" may show as "1.00000000") but not on an
 * amount that already carries decimals, which must show its exact digit sequence — "0.1"
 * does not match "0.10". Asymmetric on purpose: on a decimal amount a trailing zero is a
 * change in rendered precision worth catching, and no surface currently pads one.
 *
 * Both boundaries are guarded, and both guards have to know about the grouping separator:
 * a plain substring check accepts "0.1234567890" for "0.123456789"; `(?<!\d)` alone accepts
 * "0.1" and "1,123" for "1" and "123"; `(?!\d)` alone accepts "1.17" and "1,000" for "1".
 *
 * Assumes an en-US-formatted surface — "." is the decimal separator, "," groups thousands.
 * Under a comma-decimal locale ("1 234,56") the tolerated separators are ambiguous and this
 * pattern is not safe; the `lang` fixture defaults to "en-US".
 *
 * Used by the desktop amount assertion; intended to be shared with the mobile one
 * (LIVE-37070) so the two cannot drift.
 */
export function exactAmountPattern(amount: string): RegExp {
  const [integerPart, decimalPart] = amount.split(".");
  const groupedInteger = integerPart.split("").join(GROUPING_SEPARATOR);
  // Both ends need the same three exclusions, or the pattern matches a different number:
  // a bare digit, a decimal point ("0.1" for "1", "1.17" for "1"), and a grouping separator
  // next to a digit ("1,123" for "123", "1,000" for "1"). The integer branch additionally
  // allows a zero-padded fraction, which is the same number ("1" shown as "1.00000000").
  const tail = decimalPart
    ? String.raw`\.${decimalPart}(?![\d.])`
    : String.raw`(?:\.0+)?(?![\d.]|${GROUPING}\d)`;
  return new RegExp(String.raw`(?<![\d.]|\d${GROUPING})${groupedInteger}${tail}`);
}
