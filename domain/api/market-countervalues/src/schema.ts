import { z } from "zod";

/**
 * A rates payload: keys are date stamps for a historical window, or currency API ids for a spot
 * batch; values are rates.
 *
 * Non-numeric entries are dropped rather than rejected. The fetch path had no validation before
 * this package existed, and a single bad entry rejecting the whole batch would lose every other
 * rate in it. A dropped key reads back as a missing rate, which the callers already handle.
 */
export const RatesResponseSchema = z
  .record(z.string(), z.unknown())
  .transform(raw =>
    Object.fromEntries(
      Object.entries(raw).filter(
        (entry): entry is [string, number] => typeof entry[1] === "number",
      ),
    ),
  );

/** A rates payload, inferred from {@link RatesResponseSchema}. */
export type RatesResponse = z.infer<typeof RatesResponseSchema>;

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
