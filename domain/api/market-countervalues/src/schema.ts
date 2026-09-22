import { z } from "zod";

/**
 * A rates payload as received: keys are date stamps for a historical window, or currency API ids
 * for a spot batch.
 *
 * Values are `unknown` here and filtered afterwards rather than validated in place. The fetch path
 * had no validation before this package existed, and one bad entry rejecting the whole response
 * would lose every other rate in the same batch. See `pickNumericRates`.
 */
export const RawRatesResponseSchema = z.record(z.string(), z.unknown());

/** A rates payload as received, inferred from {@link RawRatesResponseSchema}. */
export type RawRatesResponse = z.infer<typeof RawRatesResponseSchema>;

/** Rates keyed by date stamp or by currency API id. */
export type RatesResponse = Record<string, number>;

/** Supported crypto API ids, most valuable first. */
export const CounterValueIdsSortedByMarketCapSchema = z.array(z.string().min(1));

/** Supported crypto ids, inferred from {@link CounterValueIdsSortedByMarketCapSchema}. */
export type CounterValueIdsSortedByMarketCap = z.infer<
  typeof CounterValueIdsSortedByMarketCapSchema
>;

/** What the apps show until the supported-crypto list has loaded. */
export const defaultCounterValueIdsSortedByMarketCap: CounterValueIdsSortedByMarketCap = [];

/** Raw `/v3/spot/simple` payload, before the USD rate is picked out of it. */
export const SpotSimpleResponseSchema = z.record(z.string(), z.number());

/** A spot payload, inferred from {@link SpotSimpleResponseSchema}. */
export type SpotSimpleResponse = z.infer<typeof SpotSimpleResponseSchema>;
