// @flow
import type { Currency } from "../types";

// CountervaluesSettings is user config that drives the countervalues logic.
// we generally will just infer it from Accounts
export type CountervaluesSettings = {
  trackingPairs: TrackingPair[],
  autofillGaps: boolean,
};

// This is the internal state of countervalues.
export type CounterValuesState = {
  // e.g.: { "BTC-USD", { "latest": 999, "YYYY-MM-DD": daily, "YYYY-MM-DDTHH": hourly,.... }
  data: {
    [pairId: string]: RateMap,
  },
  // status is the state needed to implement the incremental logic of fetching again countervalues
  status: CounterValuesStatus,
  // this "cache" layer pre-compute all direct mapping for all dates of the range (complete holes...)
  cache: {
    [pairId: string]: PairRateMapCache,
  },
};

// serialized version of CounterValuesState to be saved/restored
// The goal here is to make a key-value map where the value is not exceeding 2MB for Android to not glitch...
export type CounterValuesStateRaw = {
  status: CounterValuesStatus,
  [pairId: string]: RateMap,
};

export type RateGranularity = "daily" | "hourly";

// a rate map is an key value object that contains all rates per date.
// it can contain both hourly and daily format
// e.g.: { "latest": 999, "YYYY-MM-DD": daily, "YYYY-MM-DDTHH": hourly,.... }
export type RateMap = {
  [dateTime: string]: number,
  // IDEA with the data we should probably have metadata:
  // startDate, endDate, path of pairs (e.g. ETH->BTC via Binance, BTC->EUR via kraken)
};

export type TrackingPair = {
  from: Currency,
  to: Currency,
  startDate?: ?Date,
};

export type CounterValuesAPI = {
  fetchHistorical: (
    granularity: RateGranularity,
    pair: TrackingPair
  ) => Promise<RateMap>,

  fetchLatest: (pairs: TrackingPair[]) => Promise<Array<?number>>,

  fetchMarketcapTickers: () => Promise<string[]>,
};

export type CounterValuesStatus = {
  [pairId: string]: {
    timestamp?: number, // time of last pull
    failures?: number, // count the number of successive failures
    // track the oldest date requested on data to know if need to pull before that
    oldestDateRequested?: string,
  },
};

export type RateMapStats = {
  oldest: ?string,
  earliest: ?string,
  oldestDate: ?Date,
  earliestDate: ?Date,
};

export type PairRateMapCache = {
  fallback?: number,
  map: RateMap,
  stats: RateMapStats,
};
