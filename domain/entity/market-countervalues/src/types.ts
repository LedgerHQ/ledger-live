import { z } from "zod";
import type { Currency } from "@domain/entity-currency";
import type {
  CounterValuesStateRawSchema,
  CounterValuesStateSchema,
  CounterValuesStatusSchema,
  CountervaluesSettingsSchema,
  PairRateMapCacheSchema,
  RateGranularitySchema,
  RateMapRawSchema,
  RateMapSchema,
  RateMapStatsSchema,
  TrackingPairSchema,
} from "./schema";

/** Rate resolution, inferred from {@link RateGranularitySchema}. */
export type RateGranularity = z.infer<typeof RateGranularitySchema>;
/** Rates keyed by date, inferred from {@link RateMapSchema}. */
export type RateMap = z.infer<typeof RateMapSchema>;
/** Serialized rate map, inferred from {@link RateMapRawSchema}. */
export type RateMapRaw = z.infer<typeof RateMapRawSchema>;
/** A pair to load rates for, inferred from {@link TrackingPairSchema}. */
export type TrackingPair = z.infer<typeof TrackingPairSchema>;
/** Per-pair fetch bookkeeping, inferred from {@link CounterValuesStatusSchema}. */
export type CounterValuesStatus = z.infer<typeof CounterValuesStatusSchema>;
/** Bounds of a rate map, inferred from {@link RateMapStatsSchema}. */
export type RateMapStats = z.infer<typeof RateMapStatsSchema>;
/** Precomputed mapping for one pair, inferred from {@link PairRateMapCacheSchema}. */
export type PairRateMapCache = z.infer<typeof PairRateMapCacheSchema>;
/** The countervalues state, inferred from {@link CounterValuesStateSchema}. */
export type CounterValuesState = z.infer<typeof CounterValuesStateSchema>;
/** Serialized countervalues state, inferred from {@link CounterValuesStateRawSchema}. */
export type CounterValuesStateRaw = z.infer<typeof CounterValuesStateRawSchema>;
/** User configuration, inferred from {@link CountervaluesSettingsSchema}. */
export type CountervaluesSettings = z.infer<typeof CountervaluesSettingsSchema>;

// Behaviour rather than data: the latest-rate fetch asks it which pairs to batch.
// Nothing validates it at a boundary, so it carries no schema.
export type BatchStrategySolver = {
  shouldBatchCurrencyFrom: (from: Currency) => boolean;
};
