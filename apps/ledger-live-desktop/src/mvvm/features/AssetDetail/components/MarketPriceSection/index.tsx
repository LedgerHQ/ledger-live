import React from "react";
import type { AssetDetailMarketInfo, AssetMarketData } from "@ledgerhq/asset-detail";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useMarketPriceSectionViewModel } from "./useMarketPriceSectionViewModel";
import { MarketPriceSectionView } from "./MarketPriceSectionView";

type MarketPriceSectionProps = Readonly<{
  distributionItem: DistributionItem | undefined;
  marketInfo: AssetDetailMarketInfo | undefined;
  ledgerId: string | undefined;
  market: AssetMarketData;
}>;

export function MarketPriceSection({
  distributionItem,
  marketInfo,
  ledgerId,
  market,
}: MarketPriceSectionProps) {
  const viewModel = useMarketPriceSectionViewModel({
    distributionItem,
    marketInfo,
    ledgerId,
    market,
  });
  const { shouldRenderSection, ...viewProps } = viewModel;
  if (!shouldRenderSection) return null;
  return <MarketPriceSectionView {...viewProps} />;
}
