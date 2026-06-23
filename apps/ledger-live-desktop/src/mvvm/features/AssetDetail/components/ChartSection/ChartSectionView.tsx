import React from "react";
import { LineChart } from "LLD/components/LineChart";
import type { ChartSectionViewModelResult } from "./useChartSectionViewModel";
import { ChartOptionsMenu } from "./ChartOptionsMenu";

type ChartSectionViewProps = Readonly<ChartSectionViewModelResult>;

function ChartSectionViewComponent({
  series,
  height,
  selectedRange,
  onRangeChange,
  color,
  isLoading,
  formatValue,
  tooltipTitle,
  onScrubberPositionChange,
  showXAxis,
  showYAxis,
  xAxis,
  yAxis,
  points,
  currencyId,
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
        rangeSelectorTrailing={<ChartOptionsMenu currencyId={currencyId} />}
      />
    </div>
  );
}

export const ChartSectionView = React.memo(ChartSectionViewComponent);
