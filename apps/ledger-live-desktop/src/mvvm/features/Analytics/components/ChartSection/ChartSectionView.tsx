import React from "react";
import { LineChart } from "LLD/components/LineChart";
import { ChartSectionHeader } from "./ChartSectionHeader";
import type { ChartSectionViewModelResult } from "./useChartSectionViewModel";

type ChartSectionViewProps = Readonly<ChartSectionViewModelResult>;

export function ChartSectionView({ header, chart }: ChartSectionViewProps) {
  return (
    <div
      className="flex flex-col gap-24 px-24"
      data-testid="analytics-chart-section"
    >
      <ChartSectionHeader viewModel={header} />
      <LineChart {...chart} />
    </div>
  );
}
