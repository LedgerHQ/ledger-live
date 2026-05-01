import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";

/**
 * Parses a locale-formatted currency string (e.g. "$1,234.56" or "1 234,56 €")
 * into a {@link FormattedValue} that Lumen's `AmountDisplay` expects.
 *
 * Why: `Intl.NumberFormat.formatToParts` would be the standard way to decompose
 * a formatted number, but it is **not available on Hermes** (React Native's JS engine).
 * This function achieves the same result by analysing the formatted string directly.
 */
export function parseCurrencyString(formatted: string, locale: string): FormattedValue {
  const decimalSeparator = getDecimalSeparator(locale);
  const cleaned = formatted.replaceAll(/\s/g, " ");

  // ' and \u2019 cover apostrophe group separators used by de-CH and similar locales (e.g. 10'000.20)
  const numMatch = /[\d.,\s'\u2019]+/.exec(cleaned);
  if (!numMatch) {
    return {
      integerPart: "0",
      decimalPart: "00",
      currencyText: "",
      decimalSeparator,
      currencyPosition: "start",
    };
  }

  const numStr = numMatch[0].trim();
  const numStart = cleaned.indexOf(numStr);
  const currencyBefore = cleaned.slice(0, numStart).trim();
  const currencyAfter = cleaned.slice(numStart + numStr.length).trim();
  const currencyText = currencyBefore || currencyAfter;
  const currencyPosition: "start" | "end" = currencyBefore ? "start" : "end";

  const sepIdx = numStr.lastIndexOf(decimalSeparator);
  let integerPart: string;
  let decimalPart: string | undefined;

  if (sepIdx === -1) {
    integerPart = numStr.replaceAll(/[^\d]/g, "");
  } else {
    integerPart = numStr.slice(0, sepIdx).replaceAll(/[^\d]/g, "");
    decimalPart = numStr.slice(sepIdx + 1);
  }

  return { integerPart, decimalPart, currencyText, decimalSeparator, currencyPosition };
}

export function getDecimalSeparator(locale: string): "." | "," {
  const sample = new Intl.NumberFormat(locale, { numberingSystem: "latn" }).format(10000.2);
  const lastNonDigit = /[^\d](?=\d+$)/.exec(sample);
  const sep = lastNonDigit?.[0];
  return sep === "." || sep === "," ? sep : ".";
}
