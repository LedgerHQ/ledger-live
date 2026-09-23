import type { z } from "zod";
import type {
  CounterValueIdsSortedByMarketCapSchema,
  RawRatesResponseSchema,
  SpotSimpleResponseSchema,
} from "./internals/schema";

// These types are public because they appear in the inferred type of `marketCountervaluesApi`,
// even where no consumer names them: an endpoint's result type is part of the api's type.

/** A rates payload as received, inferred from `RawRatesResponseSchema`. */
export type RawRatesResponse = z.infer<typeof RawRatesResponseSchema>;

/** Rates keyed by date stamp or by currency API id. */
export type RatesResponse = Record<string, number>;

/** A `/v3/spot/simple` payload, inferred from `SpotSimpleResponseSchema`. */
export type SpotSimpleResponse = z.infer<typeof SpotSimpleResponseSchema>;

/** Supported crypto ids, most valuable first. */
export type CounterValueIdsSortedByMarketCap = z.infer<
  typeof CounterValueIdsSortedByMarketCapSchema
>;

/** What the apps show until the supported-crypto list has loaded. */
export const defaultCounterValueIdsSortedByMarketCap: CounterValueIdsSortedByMarketCap = [];
