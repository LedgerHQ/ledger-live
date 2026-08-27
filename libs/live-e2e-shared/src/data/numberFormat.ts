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
  return char.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

// All separator chars used across supported locales, to isolate a full numeric token first.
const ANY_SEPARATOR_CHARS = [".", ",", " ", " ", " "].map(escapeRegExpChar).join("");
const NUMERIC_TOKEN_REGEX = new RegExp(String.raw`\d[${ANY_SEPARATOR_CHARS}\d]*\d|\d`, "g");

export function findNumericTokens(text: string): string[] {
  const tokens: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = NUMERIC_TOKEN_REGEX.exec(text)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
}

export function buildFormattedAmountPattern(separators: NumberSeparators): RegExp {
  const decimal = escapeRegExpChar(separators.decimal);
  const thousands = escapeRegExpChar(separators.thousands);
  return new RegExp(String.raw`^\d{1,3}(?:${thousands}\d{3})*(?:${decimal}\d+)?$`);
}

export function isAmountFormatted(tokens: string[], separators: NumberSeparators): boolean {
  const pattern = buildFormattedAmountPattern(separators);
  return tokens.some(token => pattern.test(token));
}
