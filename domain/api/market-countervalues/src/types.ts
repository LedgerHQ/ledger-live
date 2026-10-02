import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { Currency } from "@domain/entity-currency";
import type { RateGranularity, TrackingPair } from "@domain/entity-market-countervalues";

/** Decides which `from` currencies may share a batched spot request. */
export type BatchStrategySolver = {
  shouldBatchCurrencyFrom: (from: Currency) => boolean;
};

/** One historical window, already resolved to API ids and formatted date bounds. */
export type HistoricalRatesArgs = {
  granularity: RateGranularity;
  from: string;
  to: string;
  start: string;
  end: string;
};

/** One spot request: many `froms` against a single `to`, as API ids. */
export type SpotRatesArgs = {
  to: string;
  froms: string[];
};

/**
 * What one rate request resolves to: RTK Query's `{ data, error }` envelope, kept loose enough
 * that a `dispatch(endpoint.initiate(...))` result is assignable as-is. An app fetcher is that
 * dispatch and nothing else.
 */
export type RateQueryResult<T> = {
  data?: T;
  error?: FetchBaseQueryError | SerializedError;
};

/**
 * The promise `dispatch(endpoint.initiate(...))` returns. `unsubscribe` is optional so a test can
 * hand over a plain promise; {@link createRateSource} always calls it when present.
 */
export type RateQueryPromise<T> = Promise<RateQueryResult<T>> & { unsubscribe?: () => void };

/**
 * The two raw requests {@link createRateSource} drives.
 *
 * Each returns the `initiate` promise **unawaited**, so `createRateSource` owns awaiting it,
 * unsubscribing it and turning `{ error }` into a throw. Implementations must dispatch with
 * `{ forceRefetch: true }` and must **not** pass `subscribe: false`: without a subscriber,
 * `keepUnusedDataFor: 0` can evict the entry before the promise resolves and the result reads back
 * empty.
 */
export type RateFetchers = {
  fetchHistoricalWindow(args: HistoricalRatesArgs): RateQueryPromise<Record<string, number>>;
  fetchSpotBatch(args: SpotRatesArgs): RateQueryPromise<Record<string, number>>;
};

/**
 * Where {@link loadCountervalues} gets its rates. Deliberately free of hooks and of any Redux
 * reference so a non-React caller can supply one; apps build theirs at composition time.
 */
export type RateSource = {
  fetchHistorical(
    granularity: RateGranularity,
    pair: TrackingPair,
    granularitiesRates?: Record<RateGranularity, number>,
  ): Promise<Record<string, number>>;
  fetchLatest(
    pairs: TrackingPair[],
    batchStrategySolver?: BatchStrategySolver,
  ): Promise<Array<number | null | undefined>>;
};

/** Emits a countervalues diagnostic line. Injected so this package holds no logging dependency. */
export type CountervaluesLogger = (type: string, message: string) => void;

/** Everything {@link loadCountervalues} needs beyond the state and the user settings. */
export type LoadCountervaluesOptions = {
  /** Where rates come from. */
  rates: RateSource;
  /** Restricts which `from` currencies share a batched spot request. */
  batchStrategySolver?: BatchStrategySolver;
  /** Overrides the fetch window per granularity. */
  granularitiesRates?: Record<RateGranularity, number>;
  /** Diagnostics sink. Defaults to a no-op. */
  log?: CountervaluesLogger;
};
