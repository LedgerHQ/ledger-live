import { z } from "zod";
import { CurrencySchema } from "@domain/entity-currency";

/** Resolution of a rate datapoint: one per day, or one per hour. */
export const RateGranularitySchema = z.enum(["daily", "hourly"]);

/**
 * Rates keyed by date, mixing both granularities:
 * `{ "latest": 999, "YYYY-MM-DD": daily, "YYYY-MM-DDTHH": hourly }`.
 */
export const RateMapSchema = z.map(z.string(), z.number());

/** Serialized form of a {@link RateMapSchema}, as persisted. */
export const RateMapRawSchema = z.record(z.string(), z.number());

/** A pair of currencies to load rates for, from `startDate` onwards. */
export const TrackingPairSchema = z.object({
  from: CurrencySchema,
  to: CurrencySchema,
  startDate: z.date(),
});

/** Per-pair bookkeeping driving the incremental fetching logic. */
export const CounterValuesStatusSchema = z.record(
  z.string(),
  z.object({
    /** Time of the last pull. */
    timestamp: z.number().optional(),
    /** Number of successive failures. */
    failures: z.number().optional(),
    /** Oldest date already requested, to know whether to pull further back. */
    oldestDateRequested: z.string().optional(),
  }),
);

/** Bounds of a rate map, precomputed alongside its cache. */
export const RateMapStatsSchema = z.object({
  /** Key of the oldest datapoint. */
  oldest: z.string().nullish(),
  /** Key of the most recent datapoint. */
  earliest: z.string().nullish(),
  oldestDate: z.date().nullish(),
  earliestDate: z.date().nullish(),
  /** Most recent datapoint before the first hole in the data. */
  earliestStableDate: z.date().nullish(),
});

/** Precomputed direct mapping for one pair: holes filled, bounds resolved. */
export const PairRateMapCacheSchema = z.object({
  fallback: z.number().optional(),
  map: RateMapSchema,
  stats: RateMapStatsSchema,
});

/** The internal state of countervalues. */
export const CounterValuesStateSchema = z.object({
  data: z.record(z.string(), RateMapSchema),
  status: CounterValuesStatusSchema,
  cache: z.record(z.string(), PairRateMapCacheSchema),
  /** Set by import, cleared after the first load; triggers a hole check on that run. */
  checkHolesOnNextLoad: z.boolean().optional(),
});

/**
 * Serialized {@link CounterValuesStateSchema}, one key per pair plus `status`.
 * Flat on purpose: each value must stay under 2MB so Android does not glitch.
 */
export const CounterValuesStateRawSchema = z
  .object({ status: CounterValuesStatusSchema })
  .catchall(RateMapRawSchema);

/** User configuration driving the countervalues logic. */
export const CountervaluesSettingsSchema = z.object({
  trackingPairs: z.array(TrackingPairSchema),
  /** Fill gaps between two days, so graphs stay smooth. */
  autofillGaps: z.boolean(),
  /** General refresh rate, i.e. how often the load loop is recalled. */
  refreshRate: z.number(),
  /** Rank after which the hybrid latest-fetching strategy starts batching. */
  marketCapBatchingAfterRank: z.number(),
  /** Throw on any error rather than recovering. For tests. */
  disableAutoRecoverErrors: z.boolean().optional(),
  granularitiesRates: z.record(RateGranularitySchema, z.number()).optional(),
});
