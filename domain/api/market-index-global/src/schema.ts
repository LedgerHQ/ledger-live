import { z } from "zod";

/** Raw `/v3/markets/global` response: `percentageChanges` values are ratios (-0.0171 = -1.71%). */
export const GlobalMarketResponseSchema = z.object({
  marketCap: z.number(),
  percentageChanges: z.object({
    "1d": z.number(),
  }),
});
