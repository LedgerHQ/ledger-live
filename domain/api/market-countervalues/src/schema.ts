import type { z } from "zod";
import type { CounterValueIdsSortedByMarketCapSchema } from "./internals/schema";

/** Supported crypto ids, most valuable first. */
export type CounterValueIdsSortedByMarketCap = z.infer<
  typeof CounterValueIdsSortedByMarketCapSchema
>;

/** What the apps show until the supported-crypto list has loaded. */
export const defaultCounterValueIdsSortedByMarketCap: CounterValueIdsSortedByMarketCap = [];
