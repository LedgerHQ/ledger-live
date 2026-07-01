import React from "react";
import type { Portfolio } from "@ledgerhq/types-live";
import type { PortfolioBalanceInfo } from "LLD/hooks/usePortfolioBalanceDisplayState";
import { ChartSectionView } from "./ChartSectionView";
import { useChartSectionViewModel } from "./useChartSectionViewModel";

type ChartSectionProps = Readonly<{
  balanceInfo: PortfolioBalanceInfo;
  portfolio: Portfolio;
  isLoading: boolean;
}>;

export function ChartSection(props: ChartSectionProps) {
  const viewModel = useChartSectionViewModel(props);
  return <ChartSectionView viewModel={viewModel} />;
}
