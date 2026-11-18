import type { LineChartRange, LineChartXAxisConfig, LineChartYAxisConfig } from "../types";
import { DEFAULT_LINE_CHART_HEIGHT, LINE_CHART_DRAWING_INSET } from "../constants";
import { getEvenlySpacedTicks } from "./getEvenlySpacedTicks";

const MIN_X_AXIS_TICKS = 5;
const MIN_X_AXIS_TICKS_1D = 8;

/** Room around the max and min so their labels stay inside the drawing area, under the scrubber overlay. */
const Y_AXIS_TOP_OFFSET_PX = 24;
const Y_AXIS_BOTTOM_OFFSET_PX = 32;

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

export function buildLineChartPaddedYAxisConfig(): LineChartYAxisConfig {
  const drawingHeight = DEFAULT_LINE_CHART_HEIGHT - LINE_CHART_DRAWING_INSET.top;
  return {
    domain: ({ min, max }) => {
      const range = max - min || Math.abs(max) || 1;
      const valuePerPx = range / (drawingHeight - Y_AXIS_TOP_OFFSET_PX - Y_AXIS_BOTTOM_OFFSET_PX);
      return {
        min: min - Y_AXIS_BOTTOM_OFFSET_PX * valuePerPx,
        max: max + Y_AXIS_TOP_OFFSET_PX * valuePerPx,
      };
    },
  };
}
