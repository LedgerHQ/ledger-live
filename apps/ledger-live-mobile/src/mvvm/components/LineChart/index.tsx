import React from "react";
import { LineChartView } from "./LineChartView";
import { useLineChartViewModel } from "./useLineChartViewModel";
import type { LineChartProps } from "./types";

export { DEFAULT_LINE_CHART_HEIGHT } from "./constants";
export { resolveLineChartColorFromPercentChange } from "./utils/resolveLineChartColor";
export { getExtremaPointMarkers } from "./utils/getExtremaPointMarkers";
export type {
  LineChartColor,
  LineChartProps,
  LineChartSeries,
  LineChartPointMarker,
  LineChartValueFormatter,
  LineChartTooltipTitle,
  LineChartScrubberPositionChange,
  LineChartXAxisConfig,
  LineChartYAxisConfig,
} from "./types";

export function LineChart<TRange extends string>(props: LineChartProps<TRange>) {
  const viewModel = useLineChartViewModel(props);
  return <LineChartView {...viewModel} />;
}
