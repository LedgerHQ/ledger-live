import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useMarketPriceSectionViewModel } from "./useMarketPriceSectionViewModel";
import { MarketPriceSectionView } from "./MarketPriceSectionView";

type MarketPriceSectionProps = Readonly<{
  distributionItem: DistributionItem | undefined;
  marketAssetId: string | undefined;
}>;

export function MarketPriceSection({ distributionItem, marketAssetId }: MarketPriceSectionProps) {
  const viewModel = useMarketPriceSectionViewModel({
    distributionItem,
    marketAssetId,
  });

  return <MarketPriceSectionView {...viewModel} />;
}
