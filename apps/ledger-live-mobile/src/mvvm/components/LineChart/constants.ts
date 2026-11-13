import type { LineChartColor } from "./types";

export const DEFAULT_LINE_CHART_HEIGHT = 203;

export const LINE_CHART_POINT_SIZE = 10;

/** What Lumen's scrubber overlay (opacity 0.8) leaves visible of the content under it. */
export const LINE_CHART_SCRUBBER_DIMMED_OPACITY = 0.2;

export const LINE_CHART_EXTREMA_COLORS = {
  max: "success",
  min: "error",
} as const satisfies { max: LineChartColor; min: LineChartColor };
