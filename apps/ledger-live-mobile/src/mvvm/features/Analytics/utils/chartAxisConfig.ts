import { DEFAULT_LINE_CHART_HEIGHT } from "LLM/components/LineChart";
import type { LineChartXAxisConfig, LineChartYAxisConfig } from "LLM/components/LineChart";
import type { AnalyticsChartRange } from "./portfolioRangeMapping";

const MIN_X_AXIS_TICKS = 5;
const MIN_X_AXIS_TICKS_1D = 8;
const Y_AXIS_BOTTOM_OFFSET_PX = 50;

function getEvenlySpacedTicks(length: number, minTicks: number): number[] {
  if (length <= 0) return [];
  if (length <= minTicks) return Array.from({ length }, (_, index) => index);

  const ticks = Array.from({ length: minTicks }, (_, index) =>
    Math.round((index * (length - 1)) / (minTicks - 1)),
  );
  return Array.from(new Set(ticks));
}

export function buildAnalyticsChartXAxisConfig({
  timestamps,
  selectedRange,
  formatDate,
}: {
  readonly timestamps: number[];
  readonly selectedRange: AnalyticsChartRange;
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

export function buildAnalyticsChartYAxisConfig(): LineChartYAxisConfig {
  return {
    domain: ({ min, max }) => {
      const range = max - min || Math.abs(max) || 1;
      const valuePerPx = range / DEFAULT_LINE_CHART_HEIGHT;
      return {
        min: min - Y_AXIS_BOTTOM_OFFSET_PX * valuePerPx,
        max,
      };
    },
  };
}
