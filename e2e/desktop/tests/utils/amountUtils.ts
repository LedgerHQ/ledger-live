import { expect } from "@playwright/test";

export function expectAmountCloseTo(actual: number, expected: number, relativeTolerance = 0.01) {
  const tolerance = Math.max(expected * relativeTolerance, 1e-6);
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
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
