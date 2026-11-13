import { getTrendTone, type TrendTone } from "@shared/trend";
import type { LineChartColor } from "../types";

const LINE_CHART_COLOR_BY_TONE: Record<TrendTone, LineChartColor> = {
  positive: "success",
  negative: "error",
  neutral: "muted",
};

export function resolveLineChartColorFromPercentChange(percent?: number | null): LineChartColor {
  return LINE_CHART_COLOR_BY_TONE[getTrendTone(percent)];
}
