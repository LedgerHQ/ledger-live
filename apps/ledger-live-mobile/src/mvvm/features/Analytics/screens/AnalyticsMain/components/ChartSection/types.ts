import type { LineChartProps } from "LLM/components/LineChart";
import type { AnalyticsChartRange } from "LLM/features/Analytics/utils/portfolioRangeMapping";

export type ChartSectionHeaderViewModel = Readonly<{
  hoveredBalance: number | null;
  isBalanceAvailable: boolean;
  percentageValue: number;
  variationText: string;
  rangeLabel: string;
  discreet: boolean;
}>;

export type ChartSectionViewModel = Readonly<{
  header: ChartSectionHeaderViewModel;
  chart: LineChartProps<AnalyticsChartRange>;
}>;

export const CHART_SECTION_TEST_IDS = {
  root: "analytics-chart-section",
  header: "analytics-chart-header",
  trend: "analytics-balance-trend",
} as const;
