import { MarketListRequestParams } from "@ledgerhq/live-common/market/utils/types";
import { getSortParam } from "@ledgerhq/live-common/market/utils/index";
import { rangeDataTable } from "@ledgerhq/live-common/cg-client/utils/rangeDataTable";
import {
  findCryptoCurrencyByTicker,
  findFiatCurrencyByTicker,
} from "@ledgerhq/live-common/currencies/index";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { TFunction } from "i18next";

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

const dateFormatters: Record<string, { [key: string]: Intl.DateTimeFormat }> = {};

const formatters: Record<string, { [key: string]: Intl.NumberFormat }> = {};

const MAXIMUM_FRACTION_DIGITS = 8;

const getFractionDigitOptions = (
  unit: Unit | undefined,
  shorten: boolean | undefined,
): Pick<Intl.NumberFormatOptions, "maximumFractionDigits" | "minimumFractionDigits"> => {
  const maximumFractionDigits = shorten ? 3 : MAXIMUM_FRACTION_DIGITS;

  if (!unit) return { maximumFractionDigits };

  return {
    maximumFractionDigits,
    minimumFractionDigits: shorten ? 0 : Math.min(unit.magnitude, maximumFractionDigits),
  };
};

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

type NumberFormatterResult = {
  formatter: Intl.NumberFormat;
  unit?: Unit;
};

const getNumberFormatter = (
  locale: string,
  currency?: string,
  shorten?: boolean,
): NumberFormatterResult => {
  if (!currency) return { formatter: new Intl.NumberFormat(locale) };

  const normalizedCurrency = currency.toUpperCase();
  const fiat = findFiatCurrencyByTicker(normalizedCurrency);
  const crypto = findCryptoCurrencyByTicker(normalizedCurrency);
  const unit = fiat?.units[0] ?? crypto?.units[0];
  const formatterKey = `${normalizedCurrency}:${shorten ? "short" : "full"}`;

  if (!formatters[locale]) formatters[locale] = {};
  if (!formatters[locale][formatterKey]) {
    formatters[locale][formatterKey] = new Intl.NumberFormat(
      locale,
      unit
        ? {
            style: "decimal",
            ...getFractionDigitOptions(unit, shorten),
          }
        : {
            style: "currency",
            currency: normalizedCurrency,
            ...getFractionDigitOptions(undefined, shorten),
            maximumSignificantDigits: 8,
          },
    );
  }

  return { formatter: formatters[locale][formatterKey], unit };
};

const formatWithUnit = (value: string, unit?: Unit): string => {
  if (!unit) return value;
  if (unit.prefixCode && value.startsWith("-")) return `-${unit.code}${value.slice(1)}`;
  return unit.prefixCode ? `${unit.code}${value}` : `${value} ${unit.code}`;
};

const formatShortenedValue = (
  formatter: Intl.NumberFormat,
  value: number,
  t: TFunction,
  unit?: Unit,
): string => {
  const sign = value < 0 ? "-" : "";
  const v = Math.abs(value);
  const index = Math.min(Math.floor(Math.log(v + 1) / Math.log(10) / 3) || 0, indexes.length - 1);

  const [i, n] = indexes[index];

  const roundedValue = Math.floor((v / n) * 1000) / 1000;
  const number = formatter.format(roundedValue);

  const I = t(`numberCompactNotation.${i}`);
  const suffix = I ? ` ${I}` : "";
  const signedNumber = number.replace(/([0-9,. ]+)/, `${sign}$1${suffix}`);

  return formatWithUnit(signedNumber, unit);
};

export const counterValueFormatter = ({
  currency,
  value,
  shorten,
  locale,
  t,
  allowZeroValue = false,
  ticker = "",
}: {
  currency?: string;
  value: number;
  shorten?: boolean;
  locale: string;
  t?: TFunction;
  allowZeroValue?: boolean;
  ticker?: string;
}): string => {
  if (isNaN(value) || (!value && !allowZeroValue)) {
    return "-";
  }

  const { formatter, unit } = getNumberFormatter(locale, currency, shorten);
  const upperCaseTicker = ticker.trim().toUpperCase();

  if (shorten && t) {
    return `${formatShortenedValue(formatter, value, t, unit)} ${upperCaseTicker}`.trim();
  }

  return `${formatWithUnit(formatter.format(value), unit)} ${upperCaseTicker}`.trim();
};

export function getAnalyticsProperties<P extends object>(
  requestParams: MarketListRequestParams,
  otherProperties?: P,
) {
  return {
    ...otherProperties,
    access: false,
    ...(requestParams.order &&
      requestParams.range && { sort: getSortParam(requestParams.order, requestParams.range) }),
    "%change": requestParams.range,
    countervalue: requestParams.counterCurrency,
    view: requestParams.liveCompatible ? "Only Live Supported" : "All coins",
  };
}

export const isDataStale = (lastUpdate: number, refreshRate: number) => {
  const currentTime = new Date();
  const updatedAt = new Date(lastUpdate);
  const elapsedTime = currentTime.getTime() - updatedAt.getTime();

  return elapsedTime > refreshRate;
};

export function getCurrentPage(indexPosition: number, pageSize: number): number {
  return Math.floor(indexPosition / pageSize) + 1;
}
