import type { AnalyticsPeriod, AnalyticsPortfolioRange } from "../../types";

const PERIOD_BY_RANGE = {
  day: "1d",
  week: "1w",
  month: "1m",
  year: "1y",
  all: "all",
} as const satisfies Record<AnalyticsPortfolioRange, AnalyticsPeriod>;

export function toAnalyticsPeriod(range: AnalyticsPortfolioRange): AnalyticsPeriod {
  return PERIOD_BY_RANGE[range];
}
