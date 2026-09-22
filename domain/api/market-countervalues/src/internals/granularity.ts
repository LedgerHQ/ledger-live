// Granularity-keyed constants the fetch layer needs. They live here rather than in
// @domain/entity-market-countervalues because only fetching reads them.

import {
  formatCounterValueDay,
  formatCounterValueHour,
  type RateGranularity,
} from "@domain/entity-market-countervalues";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Date formatter per granularity, keying the rate maps. */
export const formatPerGranularity: Record<RateGranularity, (arg0: Date) => string> = {
  daily: formatCounterValueDay,
  hourly: formatCounterValueHour,
};

/** How far back each granularity fetches. */
export const datapointLimits: Record<RateGranularity, number> = {
  daily: 9999 * DAY,
  hourly: 7 * DAY, // we fetch at MOST a week of hourly. after that there are too much data...
};

/** Fallback fetch windows, used when the caller supplies no `granularitiesRates`. */
export const defaultGranularityRates: Record<RateGranularity, number> = {
  daily: 14 * DAY,
  hourly: 2 * DAY,
};
