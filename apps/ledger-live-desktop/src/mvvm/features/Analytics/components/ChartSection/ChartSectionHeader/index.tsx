import React from "react";
import type { PortfolioBalanceInfo } from "LLD/hooks/usePortfolioBalanceDisplayState";
import { ChartSectionHeaderView } from "./ChartSectionHeaderView";
import { useChartSectionHeaderViewModel } from "./useChartSectionHeaderViewModel";

export type { ChartSectionHeaderViewModel } from "./types";

type ChartSectionHeaderProps = Readonly<{
  balanceInfo: PortfolioBalanceInfo;
  hoveredBalance: number | null;
}>;

export function ChartSectionHeader({ balanceInfo, hoveredBalance }: ChartSectionHeaderProps) {
  const viewModel = useChartSectionHeaderViewModel({ balanceInfo, hoveredBalance });
  return <ChartSectionHeaderView viewModel={viewModel} />;
}
