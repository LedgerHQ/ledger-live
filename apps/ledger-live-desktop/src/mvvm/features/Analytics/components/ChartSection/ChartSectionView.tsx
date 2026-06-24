import React from "react";
import { LineChart } from "LLD/components/LineChart";
import { ChartSectionHeader } from "./ChartSectionHeader";
import type { ChartSectionViewModelResult } from "./useChartSectionViewModel";

type ChartSectionViewProps = Readonly<
  ChartSectionViewModelResult & {
    isLoading: boolean;
    shouldDisplayBalanceRefreshRework: boolean;
  }
>;

export function ChartSectionView({
  balanceInfo,
  hoveredBalance,
  chart,
  isLoading,
  shouldDisplayBalanceRefreshRework,
}: ChartSectionViewProps) {
  return (
    <div className="flex flex-col gap-24 px-24" data-testid="analytics-chart-section">
      <ChartSectionHeader
        balanceInfo={balanceInfo}
        hoveredBalance={hoveredBalance}
        isLoading={isLoading}
        shouldDisplayBalanceRefreshRework={shouldDisplayBalanceRefreshRework}
      />
      <LineChart {...chart} />
    </div>
  );
}
