import type { AnalyticsPeriod, AnalyticsPortfolioRange } from "../../types";

const PERIOD_BY_RANGE = {
  day: "1d",
  week: "1w",
  month: "1m",
  year: "1y",
  all: "all",
} as const satisfies Record<AnalyticsPortfolioRange, AnalyticsPeriod>;

const RANGE_BY_PERIOD = {
  "1d": "day",
  "1w": "week",
  "1m": "month",
  "1y": "year",
  all: "all",
} as const satisfies Record<AnalyticsPeriod, AnalyticsPortfolioRange>;

export function toAnalyticsPeriod(range: AnalyticsPortfolioRange): AnalyticsPeriod {
  return PERIOD_BY_RANGE[range];
}

export function toAnalyticsPortfolioRange(period: AnalyticsPeriod): AnalyticsPortfolioRange {
  return RANGE_BY_PERIOD[period];
}
