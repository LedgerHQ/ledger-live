import React from "react";
import { LineChartView } from "./LineChartView";
import { useLineChartViewModel } from "./useLineChartViewModel";
import type { LineChartProps } from "./types";

export { LineChartLoading } from "./LineChartLoading";
export { LineChartError } from "./LineChartError";
export { LINE_CHART_RANGES, DEFAULT_LINE_CHART_HEIGHT } from "./constants";
export type {
  LineChartProps,
  LineChartRange,
  LineChartSeries,
  LineChartColor,
  LineChartPointMarker,
  LineChartPointLabelPosition,
  LineChartValueFormatter,
  LineChartTooltipTitle,
  LineChartScrubberPositionChange,
  LineChartXAxisConfig,
  LineChartYAxisConfig,
} from "./types";
export { resolveLineChartColorFromPercentChange } from "./utils/resolveLineChartColor";
export { getSeriesExtrema } from "./utils/getSeriesExtrema";
export type { SeriesExtrema, SeriesExtremum } from "./utils/getSeriesExtrema";
export { getExtremaPointMarkers } from "./utils/getExtremaPointMarkers";

export function LineChart(props: LineChartProps) {
  const viewModel = useLineChartViewModel(props);
  return <LineChartView {...viewModel} />;
}
