import {
  findNumericTokens,
  isAmountFormatted,
  type NumberSeparators,
} from "@ledgerhq/live-e2e-shared/data/numberFormat";

// Matches on the full numeric token (not a loose substring) so a wrongly-formatted number
// can't slip through. `context` is embedded in every thrown message, so a failure identifies
// which call site it came from without needing a separate Allure step per assertion.
export function expectFormattedAmount(
  text: string | null,
  separators: NumberSeparators,
  context: string,
): void {
  const label = ` (${context})`;
  if (!text) {
    throw new Error(`Expected a formatted amount but got "${text}"${label}`);
  }
  const value = text.trim();
  const tokens = findNumericTokens(value);
  if (tokens.length === 0) {
    throw new Error(`No numeric value found in "${value}"${label}`);
  }

  if (!isAmountFormatted(tokens, separators)) {
    throw new Error(
      `None of the numbers in "${value}"${label} are formatted with decimal "${separators.decimal}" ` +
        `and thousands "${separators.thousands}" (found: ${tokens.join(", ")})`,
    );
  }
}

type ToleranceOptions = {
  expected: number;
  /** How far `actual` may be from `expected`, either way. */
  tolerance: number;
};

/** Asserts `actual` is within `tolerance` of `expected`, e.g. amounts that differ by display rounding. */
export function expectWithinTolerance(actual: number, options: ToleranceOptions): void {
  const { expected, tolerance } = options;
  jestExpect(actual).toBeGreaterThanOrEqual(expected - tolerance);
  jestExpect(actual).toBeLessThanOrEqual(expected + tolerance);
}
