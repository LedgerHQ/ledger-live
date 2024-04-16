import { Currency } from "@ledgerhq/types-cryptoassets";
import type { RateGranularity } from "./types";

export const inferCurrencyAPIID = (currency: Currency): string => {
  switch (currency.type) {
    case "FiatCurrency": {
      return currency.ticker;
    }
    case "CryptoCurrency":
    case "TokenCurrency": {
      return currency.id;
    }
  }
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const incrementPerGranularity: Record<RateGranularity, number> = {
  daily: DAY,
  hourly: HOUR,
};

export const datapointLimits: Record<RateGranularity, number> = {
  daily: 9999 * DAY,
  hourly: 7 * DAY, // we fetch at MOST a week of hourly. after that there are too much data...
};

/**
 * efficient implementation of YYYY-MM-DD formatter
 * @memberof countervalue
 */
export const formatCounterValueDay = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * efficient implementation of YYYY-MM-DDTHH formatter
 * @memberof countervalue
 */
export const formatCounterValueHour = (d: Date): string => d.toISOString().slice(0, 13);

/**
 * full version of formatCounterValue*
 */
export const formatCounterValueHashes = (d: Date): { iso: string; day: string; hour: string } => {
  const iso = d.toISOString();
  return {
    iso,
    day: iso.slice(0, 10),
    hour: iso.slice(0, 13),
  };
};

export const parseFormattedDate = (str: string): Date => {
  let full = str;

  switch (str.length) {
    case 10:
      full += "T00:00";
      break;

    case 13:
      full += ":00";
      break;
  }

  full += ":00.000Z";
  return new Date(full);
};

export const formatPerGranularity: Record<RateGranularity, (arg0: Date) => string> = {
  daily: formatCounterValueDay,
  hourly: formatCounterValueHour,
};

// a hash function used to identify a pair of currencies, internal use only (not used for the API)
export function pairId({ from, to }: { from: Currency; to: Currency }): string {
  return `${inferCurrencyAPIID(to)} ${inferCurrencyAPIID(from)}`;
}

export function magFromTo(from: Currency, to: Currency): number {
  return 10 ** (to.units[0].magnitude - from.units[0].magnitude);
}
