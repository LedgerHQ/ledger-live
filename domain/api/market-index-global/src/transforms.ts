import type { MarketIndexGlobal } from "@domain/entity-market-index-global";
import { GlobalMarketDataResponseSchema } from "./schema";

/** Validates the raw countervalues response and maps it to the canonical {@link MarketIndexGlobal}. */
export function transformGlobalMarketDataResponse(response: unknown): MarketIndexGlobal {
  const { marketCap, percentageChanges } = GlobalMarketDataResponseSchema.parse(response);
  return {
    marketCap,
    changePercentage24h: percentageChanges["1d"] * 100,
  };
}
