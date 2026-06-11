import React from "react";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { LineChartRange } from "LLD/components/LineChart";
import { useMarketPriceSectionViewModel } from "./useMarketPriceSectionViewModel";
import { MarketPriceSectionView } from "./MarketPriceSectionView";

type MarketPriceSectionProps = Readonly<{
  distributionItem?: DistributionItem;
  ledgerId?: string;
  marketData: AssetMarketData;
  isDistributionLoading: boolean;
  selectedRange: LineChartRange;
}>;

export function MarketPriceSection({
  distributionItem,
  ledgerId,
  marketData,
  isDistributionLoading,
  selectedRange,
}: MarketPriceSectionProps) {
  const viewModel = useMarketPriceSectionViewModel({
    distributionItem,
    ledgerId,
    marketData,
    isDistributionLoading,
    selectedRange,
  });
  const { shouldRenderSection, ...viewProps } = viewModel;
  if (!shouldRenderSection) return null;
  return <MarketPriceSectionView {...viewProps} />;
}
