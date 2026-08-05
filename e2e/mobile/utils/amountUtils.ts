import { escapeRegExp } from "../helpers/commonHelpers";

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

// All separator chars used across supported locales, to isolate a full numeric token first.
const ANY_SEPARATOR_CHARS = [".", ",", " ", " ", " "].map(escapeRegExp).join("");
const NUMERIC_TOKEN_REGEX = new RegExp(String.raw`\d[${ANY_SEPARATOR_CHARS}\d]*\d|\d`, "g");

// Exported so callers can also wait for a locale-formatted value (e.g. in place of the
// English-only `floatNumberRegex` from `@ledgerhq/live-e2e-shared/data/regexes`).
export function buildFormattedAmountPattern(separators: NumberSeparators): RegExp {
  const decimal = escapeRegExp(separators.decimal);
  const thousands = escapeRegExp(separators.thousands);
  return new RegExp(String.raw`^\d{1,3}(?:${thousands}\d{3})*(?:${decimal}\d+)?$`);
}

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
  const tokens: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = NUMERIC_TOKEN_REGEX.exec(value)) !== null) {
    tokens.push(match[0]);
  }
  if (tokens.length === 0) {
    throw new Error(`No numeric value found in "${value}"${label}`);
  }

  const strictPattern = buildFormattedAmountPattern(separators);

  const matchesExpectedFormat = tokens.some(token => strictPattern.test(token));
  if (!matchesExpectedFormat) {
    throw new Error(
      `None of the numbers in "${value}"${label} are formatted with decimal "${separators.decimal}" ` +
        `and thousands "${separators.thousands}" (found: ${tokens.join(", ")})`,
    );
  }
}
