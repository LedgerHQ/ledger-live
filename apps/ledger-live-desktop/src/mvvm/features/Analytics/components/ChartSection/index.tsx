import React from "react";
import type { PortfolioBalanceInfo } from "LLD/hooks/usePortfolioBalanceDisplayState";
import { ChartSectionView } from "./ChartSectionView";
import { useChartSectionViewModel } from "./useChartSectionViewModel";

type ChartSectionProps = Readonly<{
  balanceInfo: PortfolioBalanceInfo;
}>;

export function ChartSection({ balanceInfo }: ChartSectionProps) {
  const viewModel = useChartSectionViewModel({ balanceInfo });
  return <ChartSectionView {...viewModel} />;
}
