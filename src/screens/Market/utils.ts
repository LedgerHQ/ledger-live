import { TFunction } from "i18next";
import { localeSelector } from "../../reducers/settings";

const indexes: [string, number][] = [
  ["d", 1],
  ["K", 1000],
  ["M", 1000000],
  ["B", 1000000000],
  ["T", 1000000000000],
  ["Q", 1000000000000000],
  ["Qn", 1000000000000000000],
];

const dateFormatters = {};

const formatters = {};

export const getDateFormatter = (locale: string, interval: string) => {
  if (!dateFormatters[locale]) {
    dateFormatters[locale] = {
      "24h": new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "numeric",
      }),
      "7d": new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      }),
      "30d": new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
      }),
      default: new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
      }),
    };
  }

  return dateFormatters[locale][interval] || dateFormatters[locale].default;
};

export const counterValueFormatter = ({
  currency,
  value,
  shorten,
  locale,
  t,
  allowZeroValue = false,
}: {
  currency?: string;
  value: number;
  shorten?: boolean;
  locale: string;
  t?: TFunction;
  allowZeroValue?: boolean;
}): string => {
  if (isNaN(value) || (!value && !allowZeroValue)) {
    return "-";
  }

  if (!formatters[locale]) formatters[locale] = {};
  if (!formatters[locale]?.[currency]) {
    formatters[locale][currency] = new Intl.NumberFormat(locale, {
      style: currency ? "currency" : "decimal",
      currency,
      maximumFractionDigits: 8,
      maximumSignificantDigits: 8,
    });
  }

  const formatter = formatters[locale][currency];

  if (shorten && t) {
    const sign = value > 0 ? "" : "-";
    const v = Math.abs(value);
    const index = Math.floor(Math.log(v + 1) / Math.log(10) / 3) || 0;

    const [i, n] = indexes[index];

    const roundedValue = Math.floor((v / n) * 1000) / 1000;

    const number = formatter.format(roundedValue);

    const I = t(`numberCompactNotation.${i}`);

    const formattedNumber = number.replace(/([0-9,. ]+)/, `${sign}$1 ${I} `);

    return formattedNumber;
  }

  return formatter.format(value);
};
