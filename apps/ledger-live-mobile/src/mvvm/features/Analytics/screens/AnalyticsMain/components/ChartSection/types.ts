import type { ReactNode } from "react";
import type { LineChartProps } from "LLM/components/LineChart";
import type { AnalyticsChartRange } from "@ledgerhq/wallet-analytics";
import type { AnalyticsBalanceDisplayInput } from "LLM/features/Analytics/components/AnalyticsBalanceDisplay";

export type ChartSectionHeaderViewModel = Readonly<{
  hoveredBalance: number | null;
  scrubDateLabel: string | undefined;
  isVariationAvailable: boolean;
  percentageValue: number;
  variationText: string;
  rangeLabel: string;
  discreet: boolean;
  isVariationLoading: boolean;
  /** A scoped balance; the Portfolio balance is shown when it is omitted. */
  balance?: AnalyticsBalanceDisplayInput;
}>;

export type ChartSectionViewModel = Readonly<{
  header: ChartSectionHeaderViewModel;
  chart: LineChartProps<AnalyticsChartRange>;
}>;

export type ChartSectionModelInput = Readonly<{
  prices: readonly number[];
  timestamps: readonly number[];
  valueChange: Readonly<{ value: number; percentage?: number | null }>;
  isVariationAvailable: boolean;
  isVariationLoading?: boolean;
  isChartLoading: boolean;
  /** Resets the scrubbed point when the scoped selection changes. */
  contextKey?: string;
  balance?: AnalyticsBalanceDisplayInput;
}>;

export type ChartSectionSlots = Readonly<{
  filters?: ReactNode;
  headerContent?: ReactNode;
  plotContent?: ReactNode;
}>;

export const CHART_SECTION_TEST_IDS = {
  root: "analytics-chart-section",
  header: "analytics-chart-header",
  totalBalanceLabel: "analytics-total-balance-label",
  trend: "analytics-balance-trend",
  variationSkeleton: "analytics-variation-skeleton",
} as const;
