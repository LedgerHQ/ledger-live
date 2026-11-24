import { z } from "zod";
import { TrendingCurrenciesResponseSchema } from "./schema";

/** A raw trending currency inferred from {@link TrendingCurrenciesResponseSchema}. */
export type TrendingCurrency = z.infer<typeof TrendingCurrenciesResponseSchema>[number];

export type MarketPerformersQueryArg = {
  counterCurrency: string;
  /** Price-change window the performers are ranked on, e.g. `24h` or `7d`. */
  range: string;
  /** `desc` lists the top gainers, `asc` the top losers. */
  sort: "asc" | "desc";
  /** Number of performers returned. Defaults to 5. */
  limit?: number;
  /** Number of markets the backend ranks before taking `limit`. Defaults to 50. */
  top?: number;
  supported: boolean;
};

export type TrendingPerformersQueryArg = {
  counterCurrency: string;
};
