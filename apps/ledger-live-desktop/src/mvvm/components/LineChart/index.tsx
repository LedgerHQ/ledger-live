import React from "react";
import { LineChartView } from "./LineChartView";
import { useLineChartViewModel } from "./useLineChartViewModel";
import type { LineChartProps } from "./types";

export type {
  LineChartProps,
  LineChartRange,
  LineChartSeries,
  LineChartColor,
  LineChartPointMarker,
  LineChartValueFormatter,
  LineChartTooltipTitle,
  LineChartScrubberPositionChange,
} from "./types";
export { resolveLineChartColorFromPercentChange } from "./utils/resolveLineChartColor";
export { getExtremaPointMarkers } from "./utils/getExtremaPointMarkers";

export function LineChart(props: LineChartProps) {
  const viewModel = useLineChartViewModel(props);
  return <LineChartView {...viewModel} />;
}
