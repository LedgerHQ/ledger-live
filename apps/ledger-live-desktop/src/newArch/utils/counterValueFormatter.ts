import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";
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

export const counterValueFormatter = ({
  currency,
  value,
  shorten,
  locale,
  t,
  allowZeroValue = false,
  ticker = "",
  discreetMode = false,
}: {
  currency?: string;
  value: number;
  shorten?: boolean;
  locale: string;
  t?: TFunction;
  allowZeroValue?: boolean;
  ticker?: string;
  discreetMode?: boolean;
}): string => {
  if (!discreetMode && (isNaN(value) || (!value && !allowZeroValue))) {
    return "-";
  }

  if (!formatters[locale]) formatters[locale] = {};
  if (currency && !formatters[locale]?.[currency]) {
    try {
      formatters[locale][currency] = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 8,
        maximumSignificantDigits: 8,
      });
    } catch {
      formatters[locale][currency] = new Intl.NumberFormat(locale, {
        style: "decimal",
        maximumFractionDigits: 8,
      });
    }
  } else if (!currency && !formatters[locale]?.decimal) {
    formatters[locale].decimal = new Intl.NumberFormat(locale, {
      style: "decimal",
      maximumFractionDigits: 8,
    });
  }

  const formatter = currency
    ? formatters[locale][currency]
    : shorten
      ? new Intl.NumberFormat(locale, {
          notation: "compact",
          maximumFractionDigits: 3,
        })
      : formatters[locale].decimal;

  if (shorten && t && formatter) {
    const sign = value > 0 ? "" : "-";
    const v = Math.abs(value);
    const index = Math.floor(Math.log10(v) / 3) || 0;

    const [i, n] = indexes[index] || ["", 1];

    const roundedValue = Math.round((v / n) * 1000) / 1000;

    const number = formatter.format(roundedValue);

    const I = t(`numberCompactNotation.${i}`);

    const formattedNumber = number.replace(/([0-9,. ]+)/, `${sign}$1 ${I}`);

    return formattedNumber.trim();
  }

  if (formatter) {
    const formattedValue = formatter.format(value);
    const upperCaseTicker = ticker?.trim()?.toLocaleUpperCase();

    if (discreetMode) {
      return getSanitizedValue(currency, locale);
    }

    return `${formattedValue} ${upperCaseTicker}`.trim();
  }

  return String(value);
};
