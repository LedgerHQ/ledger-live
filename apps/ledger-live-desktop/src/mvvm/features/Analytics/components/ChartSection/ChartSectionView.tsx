import React from "react";
import { LineChart } from "LLD/components/LineChart";
import type { LineChartProps } from "LLD/components/LineChart";
import { ChartSectionHeader } from "./ChartSectionHeader";
import type { ChartSectionViewModelResult } from "./types";

type ChartSectionViewProps = Readonly<{
  viewModel: ChartSectionViewModelResult;
}>;

/**
 * Memoized chart subtree. The header re-renders on every scrub frame; keeping
 * the chart props stable avoids resetting the Lumen scrubber mid-gesture.
 */
const ChartSectionChart = React.memo(function ChartSectionChart(props: LineChartProps) {
  return <LineChart {...props} />;
});

export function ChartSectionView({ viewModel }: ChartSectionViewProps) {
  const { header, chart } = viewModel;

  return (
    <div className="flex flex-col gap-24" data-testid="analytics-chart-section">
      <ChartSectionHeader {...header} />
      <ChartSectionChart {...chart} />
    </div>
  );
}
