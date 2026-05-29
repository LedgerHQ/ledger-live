import React from "react";
import { LineChart } from "LLD/components/LineChart";
import type { ChartSectionViewModelResult } from "./useChartSectionViewModel";

type ChartSectionViewProps = Readonly<ChartSectionViewModelResult>;

export function ChartSectionView({
  series,
  selectedRange,
  onRangeChange,
  color,
  isLoading,
  isError,
  formatValue,
  tooltipTitle,
  showXAxis,
  showYAxis,
  xAxis,
  yAxis,
}: ChartSectionViewProps) {
  return (
    <div className="w-full min-w-0" data-testid="asset-detail-chart-section">
      <LineChart
        series={series}
        selectedRange={selectedRange}
        onRangeChange={onRangeChange}
        color={color}
        isLoading={isLoading}
        isError={isError}
        formatValue={formatValue}
        tooltipTitle={tooltipTitle}
        showXAxis={showXAxis}
        showYAxis={showYAxis}
        xAxis={xAxis}
        yAxis={yAxis}
      />
    </div>
  );
}
