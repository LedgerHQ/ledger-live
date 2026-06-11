import { useCallback } from "react";
import type { LineChartRange } from "LLD/components/LineChart";
import { dayFormat, hourFormat, useDateFormatter } from "~/renderer/hooks/useDateFormatter";

export function useAssetChartDateFormatter(range: LineChartRange) {
  const formatDay = useDateFormatter(dayFormat);
  const formatHour = useDateFormatter(hourFormat);
  const formatDate = range === "1d" ? formatHour : formatDay;
  return useCallback((ms: number) => formatDate(new Date(ms)), [formatDate]);
}
