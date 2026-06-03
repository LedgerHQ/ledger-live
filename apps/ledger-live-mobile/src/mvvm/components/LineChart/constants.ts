import type { LineChartColor } from "./types";

export const DEFAULT_LINE_CHART_HEIGHT = 203;

export const LINE_CHART_POINT_SIZE = 10;

export const LINE_CHART_EXTREMA_COLORS = {
  max: "success",
  min: "error",
} as const satisfies { max: LineChartColor; min: LineChartColor };
