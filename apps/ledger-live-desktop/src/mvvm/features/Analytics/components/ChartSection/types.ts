import type { PortfolioBalanceInfo } from "LLD/hooks/usePortfolioBalanceDisplayState";
import type { LineChartProps } from "LLD/components/LineChart";

export type ScrubSelection = Readonly<{ balance: number; timestamp: number }>;

export type ChartSectionHeaderInput = Readonly<{
  balanceInfo: PortfolioBalanceInfo;
  scrubSelection?: ScrubSelection;
  chartPrices: readonly number[];
  isLoading: boolean;
}>;

export type ChartSectionViewModelResult = Readonly<{
  header: ChartSectionHeaderInput;
  chart: LineChartProps;
}>;
