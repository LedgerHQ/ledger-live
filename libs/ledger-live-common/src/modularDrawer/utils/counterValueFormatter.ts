import { rangeDataTable } from "../../market/utils/rangeDataTable";
import { TFunction } from "i18next";

export const RANGES = Object.keys(rangeDataTable).filter(key => key !== "1h");

const indexes: [string, number][] = [
  ["d", 1],
  ["K", 1000],
  ["M", 1000000],
  ["B", 1000000000],
  ["T", 1000000000000],
  ["Q", 1000000000000000],
  ["Qn", 1000000000000000000],
];

const formatters: Record<string, { [key: string]: Intl.NumberFormat }> = {};

const getSanitizedValue = (currency: string | undefined, locale: string): string => {
  if (currency) {
    return `${formatters[locale][currency]
      ?.format(0)
      .replace(/[0-9,.]+/, "***")
      .trim()}`;
  }
  return "***";
};

const shouldReturnDash = (
  value: number,
  allowZeroValue: boolean,
  discreetMode: boolean,
): boolean => {
  return !discreetMode && (isNaN(value) || (!value && !allowZeroValue));
};

const ensureFormatterExists = (
  locale: string,
  currency: string | undefined,
  decimalPlaces: number,
): void => {
  if (!formatters[locale]) formatters[locale] = {};

  if (currency && !formatters[locale]?.[currency]) {
    createCurrencyFormatter(locale, currency, decimalPlaces);
  } else if (!currency && !formatters[locale]?.[`decimal_${decimalPlaces}`]) {
    createDecimalFormatter(locale, decimalPlaces);
  }
};

const createCurrencyFormatter = (locale: string, currency: string, decimalPlaces: number): void => {
  try {
    formatters[locale][currency] = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    });
  } catch {
    formatters[locale][currency] = new Intl.NumberFormat(locale, {
      style: "decimal",
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: 8,
    });
  }
};

const createDecimalFormatter = (locale: string, decimalPlaces: number): void => {
  formatters[locale][`decimal_${decimalPlaces}`] = new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

const getFormatter = (
  currency: string | undefined,
  locale: string,
  shorten: boolean | undefined,
  decimalPlaces: number,
): Intl.NumberFormat | undefined => {
  if (currency) {
    return formatters[locale][currency];
  }

  if (shorten) {
    return new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 3,
      minimumFractionDigits: Math.min(decimalPlaces, 3),
    });
  }

  return formatters[locale][`decimal_${decimalPlaces}`];
};

const formatShortenedValue = (
  value: number,
  formatter: Intl.NumberFormat,
  t: TFunction,
): string => {
  const sign = value > 0 ? "" : "-";
  const v = Math.abs(value);
  const index = Math.floor(Math.log10(v) / 3) || 0;
  const [i, n] = indexes[index] || ["", 1];
  const roundedValue = Math.round((v / n) * 1000) / 1000;
  const number = formatter.format(roundedValue);
  const I = t(`numberCompactNotation.${i}`);
  const formattedNumber = number.replace(/([0-9,. ]+)/, `${sign}$1 ${I}`);
  return formattedNumber.trim();
};

const formatRegularValue = (
  value: number,
  formatter: Intl.NumberFormat,
  ticker: string,
  currency: string | undefined,
  locale: string,
  discreetMode: boolean,
): string => {
  if (discreetMode) {
    return getSanitizedValue(currency, locale);
  }

  const formattedValue = formatter.format(value);
  const upperCaseTicker = ticker?.trim()?.toLocaleUpperCase();
  return `${formattedValue} ${upperCaseTicker}`.trim();
};

export const counterValueFormatter = ({
  currency,
  value,
  shorten,
  locale,
  t,
  allowZeroValue = false,
  ticker = "",
  discreetMode = false,
  decimalPlaces = 2,
}: {
  currency?: string;
  value: number;
  shorten?: boolean;
  locale: string;
  t?: TFunction;
  allowZeroValue?: boolean;
  ticker?: string;
  discreetMode?: boolean;
  decimalPlaces?: number;
}): string => {
  if (shouldReturnDash(value, allowZeroValue, discreetMode)) {
    return "-";
  }

  ensureFormatterExists(locale, currency, decimalPlaces);

  const formatter = getFormatter(currency, locale, shorten, decimalPlaces);

  if (!formatter) {
    return String(value);
  }

  if (shorten && t) {
    return formatShortenedValue(value, formatter, t);
  }

  return formatRegularValue(value, formatter, ticker, currency, locale, discreetMode);
};
