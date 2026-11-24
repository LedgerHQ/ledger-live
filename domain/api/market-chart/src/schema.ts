import { z } from "zod";

/** Raw countervalues `/v3/markets/chart/{range}/{id}` wire-format response: `{ values: [[ts, price], ...] }`. */
export const MarketChartResponseSchema = z.object({
  values: z.array(z.tuple([z.number(), z.number()])),
});

/** Raw countervalues `/v3/supported/markets/chart/to` wire-format response. */
export const SupportedChartCounterCurrenciesResponseSchema = z.array(z.string().min(1));
