import { z } from "zod";

/**
 * Raw countervalues `/v3/markets/global` wire-format response. `percentageChanges["1d"]` is a ratio,
 * converted to a percentage by the transform.
 */
export const GlobalMarketDataResponseSchema = z.object({
  marketCap: z.number(),
  percentageChanges: z.object({
    "1d": z.number(),
  }),
});
