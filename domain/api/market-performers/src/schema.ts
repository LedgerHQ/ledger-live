import { z } from "zod";

/** The raw `/v3/currencies/trending` response: each trending currency, and whether the backend supports it. */
export const TrendingCurrenciesResponseSchema = z.array(
  z.object({
    id: z.string(),
    supported: z.boolean(),
  }),
);
