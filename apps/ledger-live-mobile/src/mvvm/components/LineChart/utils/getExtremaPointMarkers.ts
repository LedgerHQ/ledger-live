import { LINE_CHART_EXTREMA_COLORS } from "../constants";
import type { LineChartPointMarker, LineChartSeries } from "../types";
import { getSeriesExtrema } from "./getSeriesExtrema";

export function getExtremaPointMarkers(series: LineChartSeries[]): LineChartPointMarker[] {
  const extrema = getSeriesExtrema(series);
  if (!extrema) return [];

  return [
    {
      index: extrema.max.index,
      value: extrema.max.value,
      color: LINE_CHART_EXTREMA_COLORS.max,
      labelPosition: "top",
      hidePoint: true,
    },
    {
      index: extrema.min.index,
      value: extrema.min.value,
      color: LINE_CHART_EXTREMA_COLORS.min,
      labelPosition: "bottom",
      hidePoint: true,
    },
  ];
}
