// @flow
import type { Currency } from "../types";
import type { RateGranularity } from "./types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const incrementPerGranularity: { [g: RateGranularity]: number } = {
  daily: DAY,
  hourly: HOUR,
};

export const datapointLimits: { [g: RateGranularity]: number } = {
  daily: 9999 * DAY,
  hourly: 7 * DAY, // we fetch at MOST a week of hourly. after that there are too much data...
};

/**
 * efficient implementation of YYYY-MM-DD formatter
 * @memberof countervalue
 */
export const formatCounterValueDay = (d: Date) => d.toISOString().slice(0, 10);
/**
 * efficient implementation of YYYY-MM-DDTHH formatter
 * @memberof countervalue
 */
export const formatCounterValueHour = (d: Date) => d.toISOString().slice(0, 13);

/**
 * full version of formatCounterValue*
 */
export const formatCounterValueHashes = (d: Date) => {
  const iso = d.toISOString();
  return {
    iso,
    day: iso.slice(0, 10),
    hour: iso.slice(0, 13),
  };
};

export const parseFormattedDate = (str: string) => {
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

export const formatPerGranularity: {
  [g: RateGranularity]: (Date) => string,
} = {
  daily: formatCounterValueDay,
  hourly: formatCounterValueHour,
};

export function pairId({ from, to }: { from: Currency, to: Currency }) {
  const fromTicker = from.countervalueTicker ?? from.ticker;
  const toTicker = to.countervalueTicker ?? to.ticker;
  return `${fromTicker}-${toTicker}`;
}

export function magFromTo(from: Currency, to: Currency) {
  return 10 ** (to.units[0].magnitude - from.units[0].magnitude);
}
