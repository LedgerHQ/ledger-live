import type { Currency } from "@domain/entity-currency";
import type { RateGranularity } from "./types";

/** The id a currency is known by on the countervalues API. */
export function inferCurrencyAPIID(currency: Currency): string {
  switch (currency.type) {
    case "FiatCurrency": {
      return currency.ticker;
    }
    case "CryptoCurrency":
    case "TokenCurrency": {
      // temporary solution to support assethub_polkadot
      if (currency.id === "assethub_polkadot") return "polkadot";

      // temporary solution to support concordium_testnet
      if (currency.id === "concordium_testnet") return "concordium";

      return currency.id;
    }
  }
}

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

export const datapointRetention: Record<Extract<RateGranularity, "hourly">, number> = {
  hourly: 7 * DAY, // we keep hourly data for 7 days
};

/** Efficient implementation of a YYYY-MM-DD formatter. */
export function formatCounterValueDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Efficient implementation of a YYYY-MM-DDTHH formatter. */
export function formatCounterValueHour(d: Date): string {
  return d.toISOString().slice(0, 13);
}

/** Full version of the `formatCounterValue*` formatters. */
export function formatCounterValueHashes(d: Date): { iso: string; day: string; hour: string } {
  const iso = d.toISOString();
  return {
    iso,
    day: iso.slice(0, 10),
    hour: iso.slice(0, 13),
  };
}

/** Parses back a day or hour key produced by the `formatCounterValue*` formatters. */
export function parseFormattedDate(str: string): Date {
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
}

export const formatPerGranularity: Record<RateGranularity, (arg0: Date) => string> = {
  daily: formatCounterValueDay,
  hourly: formatCounterValueHour,
};

/** Hash identifying a pair of currencies. Internal use only, never sent to the API. */
export function pairId({ from, to }: { from: Currency; to: Currency }): string {
  return `${inferCurrencyAPIID(to)} ${inferCurrencyAPIID(from)}`;
}

/** Magnitude ratio between two currencies' default units. */
export function magFromTo(from: Currency, to: Currency): number {
  return 10 ** (to.units[0].magnitude - from.units[0].magnitude);
}
