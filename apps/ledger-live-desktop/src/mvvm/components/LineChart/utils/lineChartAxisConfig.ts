import type { LineChartRange, LineChartXAxisConfig, LineChartYAxisConfig } from "../types";
import { DEFAULT_LINE_CHART_HEIGHT, LINE_CHART_DRAWING_INSET } from "../constants";
import { getEvenlySpacedTicks } from "./getEvenlySpacedTicks";

const MIN_X_AXIS_TICKS = 5;
const MIN_X_AXIS_TICKS_1D = 8;

export const LINE_CHART_Y_AXIS_BOTTOM_OFFSET_PX = 50;

/** Room above the max so its label stays inside the drawing area, under the scrubber overlay. */
export const LINE_CHART_Y_AXIS_TOP_OFFSET_PX = 24;

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

export function buildLineChartPaddedYAxisConfig({
  chartBaseHeight = DEFAULT_LINE_CHART_HEIGHT,
  drawingHeight = DEFAULT_LINE_CHART_HEIGHT - LINE_CHART_DRAWING_INSET.top,
  bottomOffsetPx = LINE_CHART_Y_AXIS_BOTTOM_OFFSET_PX,
  topOffsetPx = LINE_CHART_Y_AXIS_TOP_OFFSET_PX,
}: {
  readonly chartBaseHeight?: number;
  readonly drawingHeight?: number;
  readonly bottomOffsetPx?: number;
  readonly topOffsetPx?: number;
} = {}): LineChartYAxisConfig {
  return {
    domain: ({ min, max }) => {
      const range = max - min || Math.abs(max) || 1;
      const bottomPadding = (bottomOffsetPx * range) / chartBaseHeight;
      const valuePerDrawnPx = (range + bottomPadding) / (drawingHeight - topOffsetPx);
      return {
        min: min - bottomPadding,
        max: max + topOffsetPx * valuePerDrawnPx,
      };
    },
  };
}
