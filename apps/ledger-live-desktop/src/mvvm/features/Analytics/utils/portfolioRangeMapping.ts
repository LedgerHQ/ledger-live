import type { PortfolioRange } from "@ledgerhq/types-live";
import type { LineChartRange } from "LLD/components/LineChart";

export const ANALYTICS_CHART_RANGES: readonly LineChartRange[] = ["1d", "1w", "1m", "1y", "all"];

export const PORTFOLIO_RANGE_LABEL_KEY: Record<PortfolioRange, string> = {
  day: "assetDetails.day",
  week: "assetDetails.week",
  month: "assetDetails.month",
  year: "assetDetails.year",
  all: "assetDetails.allTime",
};

const PORTFOLIO_TO_LINE_CHART: Record<PortfolioRange, LineChartRange> = {
  day: "1d",
  week: "1w",
  month: "1m",
  year: "1y",
  all: "all",
};

const LINE_CHART_TO_PORTFOLIO: Partial<Record<LineChartRange, PortfolioRange>> = {
  "1d": "day",
  "1w": "week",
  "1m": "month",
  "1y": "year",
  all: "all",
};

export function portfolioRangeToLineChartRange(range: PortfolioRange): LineChartRange {
  return PORTFOLIO_TO_LINE_CHART[range];
}

export function lineChartRangeToPortfolioRange(range: LineChartRange): PortfolioRange | undefined {
  return LINE_CHART_TO_PORTFOLIO[range];
}
