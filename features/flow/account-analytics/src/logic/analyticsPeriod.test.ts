import { toAnalyticsPeriod, toAnalyticsPortfolioRange } from "./analyticsPeriod";

const PAIRS = [
  ["day", "1d"],
  ["week", "1w"],
  ["month", "1m"],
  ["year", "1y"],
  ["all", "all"],
] as const;

describe("analyticsPeriod", () => {
  it.each(PAIRS)("should map the %s range to the %s period and back", (range, period) => {
    expect(toAnalyticsPeriod(range)).toBe(period);
    expect(toAnalyticsPortfolioRange(period)).toBe(range);
  });
});
