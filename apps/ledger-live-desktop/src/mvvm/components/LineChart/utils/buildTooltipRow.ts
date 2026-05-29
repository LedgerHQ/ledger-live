import type { ChartTooltipItemData } from "@ledgerhq/lumen-ui-react-visualization";
import type { LineChartSeries, LineChartValueFormatter } from "../types";

export function buildTooltipRow(
  series: LineChartSeries,
  dataIndex: number,
  formatValue: LineChartValueFormatter,
): ChartTooltipItemData | null {
  const value = series.data?.[dataIndex];
  if (value == null || Number.isNaN(value)) return null;
  return {
    label: series.label ?? series.id,
    value: formatValue(value),
  };
}
