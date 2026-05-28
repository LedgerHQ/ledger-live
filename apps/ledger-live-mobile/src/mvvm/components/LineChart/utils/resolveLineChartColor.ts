import type { LineChartColor } from "../types";

export function resolveLineChartColorFromPercentChange(percent?: number | null): LineChartColor {
  if (percent == null || percent === 0) {
    return "muted";
  }

  return percent > 0 ? "success" : "error";
}
