import {
  ANALYTICS_CHART_RANGES,
  isAnalyticsChartRange,
  lineChartRangeToPortfolioRange,
  portfolioRangeToLineChartRange,
} from "../portfolioRangeMapping";

describe("portfolioRangeMapping", () => {
  it("maps portfolio ranges to line chart ranges", () => {
    expect(portfolioRangeToLineChartRange("day")).toBe("1d");
    expect(portfolioRangeToLineChartRange("week")).toBe("1w");
    expect(portfolioRangeToLineChartRange("month")).toBe("1m");
    expect(portfolioRangeToLineChartRange("year")).toBe("1y");
    expect(portfolioRangeToLineChartRange("all")).toBe("all");
  });

  it("maps supported line chart ranges back to portfolio ranges", () => {
    expect(lineChartRangeToPortfolioRange("1d")).toBe("day");
    expect(lineChartRangeToPortfolioRange("1w")).toBe("week");
    expect(lineChartRangeToPortfolioRange("1m")).toBe("month");
    expect(lineChartRangeToPortfolioRange("1y")).toBe("year");
    expect(lineChartRangeToPortfolioRange("all")).toBe("all");
    expect(lineChartRangeToPortfolioRange("6m")).toBeUndefined();
    expect(lineChartRangeToPortfolioRange("5y")).toBeUndefined();
  });

  it("exposes only portfolio-compatible analytics chart ranges", () => {
    expect(ANALYTICS_CHART_RANGES).toEqual(["1d", "1w", "1m", "1y", "all"]);
  });

  it("validates analytics chart range values", () => {
    expect(isAnalyticsChartRange("1w")).toBe(true);
    expect(isAnalyticsChartRange("6m")).toBe(false);
  });
});
