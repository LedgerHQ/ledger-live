import React from "react";
import { LineChartView } from "./LineChartView";
import { useLineChartViewModel } from "./useLineChartViewModel";
import type { LineChartProps } from "./types";

export { DEFAULT_LINE_CHART_HEIGHT } from "./constants";
export { resolveLineChartColorFromPercentChange } from "./utils/resolveLineChartColor";
export type {
  LineChartColor,
  LineChartProps,
  LineChartRangeOption,
  LineChartSeries,
} from "./types";

export function LineChart<TRange extends string>(props: LineChartProps<TRange>) {
  const viewModel = useLineChartViewModel(props);
  return <LineChartView {...viewModel} />;
}
