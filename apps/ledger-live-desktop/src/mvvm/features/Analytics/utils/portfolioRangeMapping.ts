import type { PortfolioRange } from "@ledgerhq/types-live";
import type { LineChartRange } from "LLD/components/LineChart";
import {
  ANALYTICS_CHART_RANGES as SHARED_ANALYTICS_CHART_RANGES,
  lineChartRangeToPortfolioRange as sharedLineChartRangeToPortfolioRange,
  portfolioRangeToLineChartRange as sharedPortfolioRangeToLineChartRange,
} from "@ledgerhq/wallet-analytics";

export const ANALYTICS_CHART_RANGES: readonly LineChartRange[] = SHARED_ANALYTICS_CHART_RANGES;

export const PORTFOLIO_RANGE_LABEL_KEY: Record<PortfolioRange, string> = {
  day: "assetDetails.day",
  week: "assetDetails.week",
  month: "assetDetails.month",
  year: "assetDetails.year",
  all: "assetDetails.allTime",
};

export function portfolioRangeToLineChartRange(range: PortfolioRange): LineChartRange {
  return sharedPortfolioRangeToLineChartRange(range);
}

export function lineChartRangeToPortfolioRange(range: LineChartRange): PortfolioRange | undefined {
  return sharedLineChartRangeToPortfolioRange(range);
}
