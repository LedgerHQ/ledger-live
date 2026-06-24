import React from "react";
import type { Portfolio } from "@ledgerhq/types-live";
import type { PortfolioBalanceInfo } from "LLD/hooks/usePortfolioBalanceDisplayState";
import { ChartSectionView } from "./ChartSectionView";
import { useChartSectionViewModel } from "./useChartSectionViewModel";

type ChartSectionProps = Readonly<{
  balanceInfo: PortfolioBalanceInfo;
  portfolio: Portfolio;
  isLoading: boolean;
  shouldDisplayBalanceRefreshRework: boolean;
}>;

export function ChartSection({
  balanceInfo,
  portfolio,
  isLoading,
  shouldDisplayBalanceRefreshRework,
}: ChartSectionProps) {
  const viewModel = useChartSectionViewModel({ balanceInfo, portfolio });
  return (
    <ChartSectionView
      {...viewModel}
      isLoading={isLoading}
      shouldDisplayBalanceRefreshRework={shouldDisplayBalanceRefreshRework}
    />
  );
}
