import React from "react";
import type { PortfolioBalanceInfo } from "LLD/hooks/usePortfolioBalanceDisplayState";
import { ChartSectionHeaderView } from "./ChartSectionHeaderView";
import { useChartSectionHeaderViewModel } from "./useChartSectionHeaderViewModel";

export type { ChartSectionHeaderViewModel } from "./types";

type ChartSectionHeaderProps = Readonly<{
  balanceInfo: PortfolioBalanceInfo;
  hoveredBalance: number | null;
  isLoading: boolean;
  shouldDisplayBalanceRefreshRework: boolean;
}>;

export function ChartSectionHeader({
  balanceInfo,
  hoveredBalance,
  isLoading,
  shouldDisplayBalanceRefreshRework,
}: ChartSectionHeaderProps) {
  const viewModel = useChartSectionHeaderViewModel({
    balanceInfo,
    hoveredBalance,
    isLoading,
    shouldDisplayBalanceRefreshRework,
  });
  return <ChartSectionHeaderView viewModel={viewModel} />;
}
