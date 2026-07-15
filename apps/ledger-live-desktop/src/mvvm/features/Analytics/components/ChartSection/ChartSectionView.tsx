import React from "react";
import { LineChart } from "LLD/components/LineChart";
import { ChartSectionHeader } from "./ChartSectionHeader";
import type { ChartSectionViewModelResult } from "./useChartSectionViewModel";

type ChartSectionViewProps = Readonly<{
  viewModel: ChartSectionViewModelResult;
}>;

export function ChartSectionView({ viewModel }: ChartSectionViewProps) {
  const { balanceInfo, hoveredBalance, chart, isLoading } = viewModel;

  return (
    <div className="flex flex-col gap-24" data-testid="analytics-chart-section">
      <ChartSectionHeader
        balanceInfo={balanceInfo}
        hoveredBalance={hoveredBalance}
        isLoading={isLoading}
      />
      <LineChart {...chart} />
    </div>
  );
}
