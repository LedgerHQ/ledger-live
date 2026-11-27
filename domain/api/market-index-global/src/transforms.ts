import type { MarketIndexGlobal } from "@domain/entity-market-index-global";
import type { GlobalMarketResponse } from "./types";

export function transformGlobalMarketResponse(raw: GlobalMarketResponse): MarketIndexGlobal {
  return {
    marketCap: raw.marketCap,
    changePercentage24h: raw.percentageChanges["1d"] * 100,
  };
}
