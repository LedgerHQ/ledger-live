import { useCallback } from "react";
import type { LineChartRange } from "../types";
import {
  dayAndHourFormat,
  dayFormat,
  hourFormat,
  useDateFormatter,
} from "~/renderer/hooks/useDateFormatter";

const HOVER_RANGE_WITH_TIME_AND_DATE = new Set<LineChartRange>(["1w", "1m", "6m"]);

export function useChartScrubHeaderDateLabel(selectedRange: LineChartRange) {
  const formatHoverTime = useDateFormatter(hourFormat);
  const formatHoverDay = useDateFormatter(dayFormat);
  const formatHoverDateTime = useDateFormatter(dayAndHourFormat);

  return useCallback(
    (timestamp: number) => {
      const date = new Date(timestamp);
      if (selectedRange === "1d") return formatHoverTime(date);
      if (HOVER_RANGE_WITH_TIME_AND_DATE.has(selectedRange)) return formatHoverDateTime(date);
      return formatHoverDay(date);
    },
    [selectedRange, formatHoverTime, formatHoverDay, formatHoverDateTime],
  );
}
