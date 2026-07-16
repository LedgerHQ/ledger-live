import type { PortfolioRange } from "@ledgerhq/types-live";

export const ANALYTICS_CHART_RANGES = ["1d", "1w", "1m", "1y", "all"] as const;

export type AnalyticsChartRange = (typeof ANALYTICS_CHART_RANGES)[number];

const ANALYTICS_CHART_RANGE_SET: ReadonlySet<string> = new Set(ANALYTICS_CHART_RANGES);

const PORTFOLIO_TO_CHART_RANGE: Record<PortfolioRange, AnalyticsChartRange> = {
  day: "1d",
  week: "1w",
  month: "1m",
  year: "1y",
  all: "all",
};

const CHART_TO_PORTFOLIO_RANGE: Partial<Record<AnalyticsChartRange, PortfolioRange>> = {
  "1d": "day",
  "1w": "week",
  "1m": "month",
  "1y": "year",
  all: "all",
};

export function portfolioRangeToLineChartRange(range: PortfolioRange): AnalyticsChartRange {
  return PORTFOLIO_TO_CHART_RANGE[range];
}

export function lineChartRangeToPortfolioRange(range: string): PortfolioRange | undefined {
  if (!isAnalyticsChartRange(range)) return undefined;
  return CHART_TO_PORTFOLIO_RANGE[range];
}

export function isAnalyticsChartRange(value: string): value is AnalyticsChartRange {
  return ANALYTICS_CHART_RANGE_SET.has(value);
}
