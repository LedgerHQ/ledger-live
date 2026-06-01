import React from "react";
import { SegmentedControl, SegmentedControlButton } from "@ledgerhq/lumen-ui-react";
import { LineChartPlot } from "./LineChartPlot";
import type { LineChartViewModelResult } from "./useLineChartViewModel";

type LineChartViewProps = Readonly<LineChartViewModelResult>;

export function LineChartView({
  chartSeries,
  height,
  isLoading,
  isError,
  errorMessage,
  selectedRange,
  handleSelectedChange,
  rangeSelectorLabel,
  rangeButtons,
  points,
  pointTooltips,
  enableScrubber,
  formatValue,
  tooltipTitle,
  showScrubberTooltip,
  pointTooltipsOnly,
  onScrubberPositionChange,
  showArea,
  showXAxis,
  showYAxis,
  xAxis,
  yAxis,
}: LineChartViewProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-24" data-testid="line-chart">
      <LineChartPlot
        height={height}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        chartSeries={chartSeries}
        points={points}
        pointTooltips={pointTooltips}
        enableScrubber={enableScrubber}
        formatValue={formatValue}
        tooltipTitle={tooltipTitle}
        showScrubberTooltip={showScrubberTooltip}
        pointTooltipsOnly={pointTooltipsOnly}
        onScrubberPositionChange={onScrubberPositionChange}
        showArea={showArea}
        showXAxis={showXAxis}
        showYAxis={showYAxis}
        xAxis={xAxis}
        yAxis={yAxis}
      />

      <SegmentedControl
        selectedValue={selectedRange}
        onSelectedChange={handleSelectedChange}
        tabLayout="fixed"
        aria-label={rangeSelectorLabel}
        data-testid="line-chart-range-selector"
        className="w-full"
      >
        {rangeButtons.map(({ value, label }) => (
          <SegmentedControlButton
            key={value}
            value={value}
            data-testid={`line-chart-range-${value}`}
          >
            {label}
          </SegmentedControlButton>
        ))}
      </SegmentedControl>
    </div>
  );
}
