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

/** Supported crypto API ids, most valuable first. */
export const CounterValueIdsSortedByMarketCapSchema = z.array(z.string().min(1));

/** Raw `/v3/spot/simple` payload, before the USD rate is picked out of it. */
export const SpotSimpleResponseSchema = z.record(z.string(), z.number());
