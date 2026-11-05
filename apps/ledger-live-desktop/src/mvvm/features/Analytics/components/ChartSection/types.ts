import type { PortfolioBalanceInfo } from "LLD/hooks/usePortfolioBalanceDisplayState";
import type { LineChartProps } from "LLD/components/LineChart";

export type ScrubSelection = Readonly<{ balance: number; timestamp: number }>;

export type ChartVariationStatus = "loading" | "ready" | "unavailable";

export type ChartSectionHeaderInput = Readonly<{
  balanceInfo: PortfolioBalanceInfo;
  scrubSelection?: ScrubSelection;
  chartPrices: readonly number[];
  isLoading: boolean;
  variationStatus?: ChartVariationStatus;
}>;

export type ChartSectionViewModelResult = Readonly<{
  header: ChartSectionHeaderInput;
  chart: LineChartProps;
}>;
