import type { LineChartTooltipTitle } from "../types";

export function createLineChartTooltipTitle(
  timestamps: number[],
  formatDate: (timestamp: number) => string,
): LineChartTooltipTitle {
  return dataIndex => {
    const timestamp = timestamps[dataIndex];
    if (timestamp == null) return undefined;
    return formatDate(timestamp);
  };
}
