import React from "react";
import {
  Box,
  SegmentedControl,
  SegmentedControlButton,
  Skeleton,
} from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { LineChart as LumenLineChart } from "@ledgerhq/lumen-ui-rnative-visualization";
import { LineChartPoints } from "./LineChartPoints";
import { LineChartScrubber } from "./LineChartScrubber";
import type { LineChartViewModelResult } from "./useLineChartViewModel";

type Props<TRange extends string> = Readonly<LineChartViewModelResult<TRange>>;

export function LineChartView<TRange extends string>({
  chartSeries,
  selectedRange,
  handleSelectedChange,
  ranges,
  accessibilityLabel,
  height,
  isLoading,
  testID,
  points,
  pointTooltips,
  enableScrubber,
  showScrubberTooltip,
  showScrubberBeacons,
  pointTooltipsOnly,
  formatValue,
  tooltipTitle,
  onScrubberPositionChange,
  showArea,
  showXAxis,
  showYAxis,
  xAxis,
  yAxis,
}: Props<TRange>) {
  return (
    <Box lx={containerStyle} testID={testID}>
      {isLoading ? (
        <Skeleton style={{ height }} />
      ) : (
        <LumenLineChart
          series={chartSeries}
          height={height}
          showArea={showArea}
          enableScrubbing={enableScrubber}
          onScrubberPositionChange={onScrubberPositionChange}
          showXAxis={showXAxis}
          showYAxis={showYAxis}
          xAxis={xAxis}
          yAxis={yAxis}
        >
          <LineChartPoints points={points} formatValue={formatValue} />
          {enableScrubber && (
            <LineChartScrubber
              series={chartSeries}
              formatValue={formatValue}
              tooltipTitle={tooltipTitle}
              showTooltip={showScrubberTooltip}
              showBeacons={showScrubberBeacons}
              pointTooltips={pointTooltips}
              pointTooltipsOnly={pointTooltipsOnly}
            />
          )}
        </LumenLineChart>
      )}

      <SegmentedControl
        selectedValue={selectedRange}
        onSelectedChange={handleSelectedChange}
        accessibilityLabel={accessibilityLabel}
      >
        {ranges.map(({ value, label }) => (
          <SegmentedControlButton key={value} value={value}>
            {label}
          </SegmentedControlButton>
        ))}
      </SegmentedControl>
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  gap: "s24",
};
