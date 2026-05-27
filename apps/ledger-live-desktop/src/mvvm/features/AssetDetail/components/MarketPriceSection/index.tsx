import React from "react";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useMarketPriceSectionViewModel } from "./useMarketPriceSectionViewModel";
import { MarketPriceSectionView } from "./MarketPriceSectionView";

type MarketPriceSectionProps = Readonly<{
  distributionItem?: DistributionItem;
  ledgerId?: string;
  marketData: AssetMarketData;
  isDistributionLoading: boolean;
}>;

export function MarketPriceSection({
  distributionItem,
  ledgerId,
  marketData,
  isDistributionLoading,
}: MarketPriceSectionProps) {
  const viewModel = useMarketPriceSectionViewModel({
    distributionItem,
    ledgerId,
    marketData,
    isDistributionLoading,
  });
  const { shouldRenderSection, ...viewProps } = viewModel;
  if (!shouldRenderSection) return null;
  return <MarketPriceSectionView {...viewProps} />;
}
