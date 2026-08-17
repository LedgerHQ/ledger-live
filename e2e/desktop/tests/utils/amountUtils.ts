import { expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import {
  findNumericTokens,
  isAmountFormatted,
  type NumberSeparators,
} from "@ledgerhq/live-e2e-shared/data/numberFormat";

export function expectAmountCloseTo(actual: number, expected: number, relativeTolerance = 0.01) {
  const tolerance = Math.max(expected * relativeTolerance, 1e-6);
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

// Matches on the full numeric token (not a loose substring) so a wrongly-formatted number
// can't slip through. `context` also names the Allure step, so each call site fails independently.
export async function expectFormattedAmount(
  text: string | null,
  separators: NumberSeparators,
  context: string,
): Promise<void> {
  await allure.step(context, () => {
    const label = ` (${context})`;
    if (!text) {
      throw new Error(`Expected a formatted amount but got "${text}"${label}`);
    }
    const value = text.trim();
    const tokens = findNumericTokens(value);
    expect(tokens.length, `No numeric value found in "${value}"${label}`).toBeGreaterThan(0);

    expect(
      isAmountFormatted(tokens, separators),
      `None of the numbers in "${value}"${label} are formatted with decimal "${separators.decimal}" ` +
        `and thousands "${separators.thousands}" (found: ${tokens.join(", ")})`,
    ).toBe(true);
  });
}

// Balance labels are prefixed with a translated label (e.g. "Balance 1,234.56 ETH"),
// so a plain parseFloat would return NaN; extract the numeric substring and strip
// comma thousands separators before parsing.
export function parseBalanceAmount(balanceText: string | null): number {
  const numericMatch = balanceText?.match(/\d[\d,]*(?:\.\d+)?/)?.[0];
  const balance = numericMatch ? Number.parseFloat(numericMatch.replaceAll(",", "")) : Number.NaN;
  expect(Number.isFinite(balance), `Failed to parse a numeric balance from "${balanceText}"`).toBe(
    true,
  );
  return balance;
}
