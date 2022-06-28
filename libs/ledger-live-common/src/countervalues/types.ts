import type { Currency } from "../types";
// CountervaluesSettings is user config that drives the countervalues logic.
// we generally will just infer it from Accounts
export type CountervaluesSettings = {
  trackingPairs: TrackingPair[];
  autofillGaps: boolean;
  // throw exception in "loadCountervalues" if ANY error occurs (for test purpose)
  disableAutoRecoverErrors?: boolean;
};
// This is the internal state of countervalues.
export type CounterValuesState = {
  // e.g.: { "BTC-USD", { "latest": 999, "YYYY-MM-DD": daily, "YYYY-MM-DDTHH": hourly,.... }
  data: Record<string, RateMap>;
  // status is the state needed to implement the incremental logic of fetching again countervalues
  status: CounterValuesStatus;
  // this "cache" layer pre-compute all direct mapping for all dates of the range (complete holes...)
  cache: Record<string, PairRateMapCache>;
};
// serialized version of CounterValuesState to be saved/restored
// The goal here is to make a key-value map where the value is not exceeding 2MB for Android to not glitch...
export type CounterValuesStateRaw = { status: CounterValuesStatus } & {
  [pairId: string]: RateMapRaw;
};
export type RateGranularity = "daily" | "hourly";
// a rate map is an key value object that contains all rates per date.
// it can contain both hourly and daily format
// e.g.: { "latest": 999, "YYYY-MM-DD": daily, "YYYY-MM-DDTHH": hourly,.... }
export type RateMap = Map<string, number>;
export type RateMapRaw = Record<string, number>;
export type TrackingPair = {
  from: Currency;
  to: Currency;
  startDate?: Date | null | undefined;
};
export type CounterValuesAPI = {
  fetchHistorical: (
    granularity: RateGranularity,
    pair: TrackingPair
  ) => Promise<Record<string, number>>;
  fetchLatest: (
    pairs: TrackingPair[]
  ) => Promise<Array<number | null | undefined>>;
  fetchMarketcapTickers: () => Promise<string[]>;
};
export type CounterValuesStatus = Record<
  string,
  {
    timestamp?: number;
    // time of last pull
    failures?: number;
    // count the number of successive failures
    // track the oldest date requested on data to know if need to pull before that
    oldestDateRequested?: string;
  }
>;
export type RateMapStats = {
  oldest: string | null | undefined;
  earliest: string | null | undefined;
  // oldest datapoint
  oldestDate: Date | null | undefined;
  // most recent datapoint
  earliestDate: Date | null | undefined;
  // most recent datapoint before the first "hole"
  earliestStableDate: Date | null | undefined;
};
export type PairRateMapCache = {
  fallback?: number;
  map: RateMap;
  stats: RateMapStats;
};
