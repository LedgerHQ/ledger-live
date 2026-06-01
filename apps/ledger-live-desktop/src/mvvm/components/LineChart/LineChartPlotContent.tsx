import React from "react";
import { LineChart as LumenLineChart } from "@ledgerhq/lumen-ui-react-visualization";
import { LUMEN_CHART_OVERFLOW_MARGIN } from "./constants";
import { LineChartLoading } from "./LineChartLoading";
import { LineChartError } from "./LineChartError";
import { LineChartPoints } from "./LineChartPoints";
import { LineChartScrubber } from "./LineChartScrubber";
import type {
  LineChartPointMarker,
  LineChartPointTooltip as LineChartPointTooltipData,
  LineChartScrubberPositionChange,
  LineChartSeries,
  LineChartTooltipTitle,
  LineChartValueFormatter,
  LineChartXAxisConfig,
  LineChartYAxisConfig,
} from "./types";

export type LineChartPlotContentProps = Readonly<{
  height: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  chartSeries: LineChartSeries[];
  points: LineChartPointMarker[];
  pointTooltips: ReadonlyMap<number, LineChartPointTooltipData>;
  enableScrubber: boolean;
  formatValue: LineChartValueFormatter;
  tooltipTitle?: LineChartTooltipTitle;
  showScrubberTooltip: boolean;
  pointTooltipsOnly: boolean;
  onScrubberPositionChange?: LineChartScrubberPositionChange;
  showArea: boolean;
  showXAxis: boolean;
  showYAxis: boolean;
  xAxis?: LineChartXAxisConfig;
  yAxis?: LineChartYAxisConfig;
}>;

export function LineChartPlotContent({
  height,
  isLoading,
  isError,
  errorMessage,
  chartSeries,
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
}: LineChartPlotContentProps) {
  if (isError) {
    return <LineChartError height={height} message={errorMessage} />;
  }

  if (isLoading) {
    return <LineChartLoading height={height} />;
  }

  return (
    <div
      data-testid="line-chart-plot"
      className="w-full min-w-0"
      style={{ paddingTop: LUMEN_CHART_OVERFLOW_MARGIN }}
    >
      <LumenLineChart
        series={chartSeries}
        height={height}
        width="100%"
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
            pointTooltips={pointTooltips}
            pointTooltipsOnly={pointTooltipsOnly}
          />
        )}
      </LumenLineChart>
    </div>
  );
}
