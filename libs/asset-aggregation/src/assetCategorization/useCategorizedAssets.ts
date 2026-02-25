import { useMemo } from "react";
import type { AssetsDistribution } from "@ledgerhq/types-live";
import { categorizeAssets } from "./categorizeAssets";
import type { CategorizedAssets, MarketDataMap } from "./types";

export function useCategorizedAssets(
  distribution: AssetsDistribution,
  marketData: MarketDataMap,
  stablecoinTickers: Set<string>,
): CategorizedAssets {
  const { list } = distribution;
  return useMemo(
    () => categorizeAssets(list, marketData, stablecoinTickers),
    [list, marketData, stablecoinTickers],
  );
}
