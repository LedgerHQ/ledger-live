import { useMemo } from "react";
import type { AssetsDistribution } from "@ledgerhq/types-live";
import { categorizeAssets } from "./categorizeAssets";
import type { CategorizedAssets } from "./types";

export function useCategorizedAssets(
  distribution: AssetsDistribution,
  stablecoinTickers: Set<string>,
): CategorizedAssets {
  const { list } = distribution;
  return useMemo(() => categorizeAssets(list, stablecoinTickers), [list, stablecoinTickers]);
}
