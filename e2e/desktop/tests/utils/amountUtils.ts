import { expect } from "@playwright/test";
import * as allure from "allure-js-commons";

export function expectAmountCloseTo(actual: number, expected: number, relativeTolerance = 0.01) {
  const tolerance = Math.max(expected * relativeTolerance, 1e-6);
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

export type NumberSeparators = { decimal: string; thousands: string };

export type FormattedNumberLanguage = "en" | "fr" | "de";

const SEPARATORS_BY_LANGUAGE: Record<FormattedNumberLanguage, NumberSeparators> = {
  en: { decimal: ".", thousands: "," },
  // fr-FR groups with a narrow no-break space (U+202F), not the regular U+00A0.
  fr: { decimal: ",", thousands: " " },
  de: { decimal: ",", thousands: "." },
};

export function getExpectedSeparators(language: FormattedNumberLanguage): NumberSeparators {
  return SEPARATORS_BY_LANGUAGE[language];
}

function escapeRegExpChar(char: string): string {
  return char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// All separator chars used across supported locales, to isolate a full numeric token first.
const ANY_SEPARATOR_CHARS = [".", ",", " ", " ", " "].map(escapeRegExpChar).join("");
const NUMERIC_TOKEN_REGEX = new RegExp(`\\d[${ANY_SEPARATOR_CHARS}\\d]*\\d|\\d`, "g");

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
    const tokens = value.match(NUMERIC_TOKEN_REGEX) ?? [];
    expect(tokens.length, `No numeric value found in "${value}"${label}`).toBeGreaterThan(0);

    const decimal = escapeRegExpChar(separators.decimal);
    const thousands = escapeRegExpChar(separators.thousands);
    const strictPattern = new RegExp(`^\\d{1,3}(?:${thousands}\\d{3})*(?:${decimal}\\d+)?$`);

    const matchesExpectedFormat = tokens.some(token => strictPattern.test(token));
    expect(
      matchesExpectedFormat,
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
