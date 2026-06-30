import type { LineChartRange, LineChartXAxisConfig, LineChartYAxisConfig } from "../types";
import { DEFAULT_LINE_CHART_HEIGHT } from "../constants";
import { getEvenlySpacedTicks } from "./getEvenlySpacedTicks";

const MIN_X_AXIS_TICKS = 5;
const MIN_X_AXIS_TICKS_1D = 8;

export const LINE_CHART_Y_AXIS_BOTTOM_OFFSET_PX = 50;

export const LINE_CHART_VIEW_HEIGHT =
  DEFAULT_LINE_CHART_HEIGHT + LINE_CHART_Y_AXIS_BOTTOM_OFFSET_PX;

export function buildLineChartXAxisConfig({
  timestamps,
  selectedRange,
  formatDate,
}: {
  readonly timestamps: number[];
  readonly selectedRange: LineChartRange;
  readonly formatDate: (timestamp: number) => string;
}): LineChartXAxisConfig {
  return {
    showLine: false,
    ticks: getEvenlySpacedTicks(
      timestamps.length,
      selectedRange === "1d" ? MIN_X_AXIS_TICKS_1D : MIN_X_AXIS_TICKS,
    ),
    tickLabelFormatter: value => {
      const timestamp = timestamps[Number(value)];
      return timestamp == null ? "" : formatDate(timestamp);
    },
  };
}

export function buildLineChartBottomPaddedYAxisConfig(
  chartBaseHeight = DEFAULT_LINE_CHART_HEIGHT,
  bottomOffsetPx = LINE_CHART_Y_AXIS_BOTTOM_OFFSET_PX,
): LineChartYAxisConfig {
  return {
    domain: ({ min, max }) => {
      const range = max - min || Math.abs(max) || 1;
      const valuePerPx = range / chartBaseHeight;
      return {
        min: min - bottomOffsetPx * valuePerPx,
        max,
      };
    },
  };
}
