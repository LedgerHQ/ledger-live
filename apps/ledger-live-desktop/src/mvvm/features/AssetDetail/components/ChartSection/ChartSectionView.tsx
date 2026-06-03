import React from "react";
import { LineChart } from "LLD/components/LineChart";
import type { ChartSectionViewModelResult } from "./useChartSectionViewModel";

type ChartSectionViewProps = Readonly<ChartSectionViewModelResult>;

function ChartSectionViewComponent({
  series,
  height,
  selectedRange,
  onRangeChange,
  color,
  isLoading,
  isError,
  formatValue,
  tooltipTitle,
  onScrubberPositionChange,
  showXAxis,
  showYAxis,
  xAxis,
  yAxis,
  points,
}: ChartSectionViewProps) {
  return (
    <div className="w-full min-w-0" data-testid="asset-detail-chart-section">
      <LineChart
        series={series}
        selectedRange={selectedRange}
        onRangeChange={onRangeChange}
        color={color}
        height={height}
        isLoading={isLoading}
        isError={isError}
        formatValue={formatValue}
        tooltipTitle={tooltipTitle}
        showScrubberTooltip={true}
        pointTooltipsOnly={true}
        onScrubberPositionChange={onScrubberPositionChange}
        showXAxis={showXAxis}
        showYAxis={showYAxis}
        xAxis={xAxis}
        yAxis={yAxis}
        points={points}
      />
    </div>
  );
}

export const ChartSectionView = React.memo(ChartSectionViewComponent);
