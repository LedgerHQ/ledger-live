import { buildAnalyticsPortfolioChartSeries } from "../buildAnalyticsPortfolioChartSeries";

describe("buildAnalyticsPortfolioChartSeries", () => {
  const now = new Date("2026-06-25T12:00:00.000Z").getTime();

  const history = [
    { date: new Date("2025-01-01T00:00:00.000Z"), value: 100 },
    { date: new Date("2025-06-01T00:00:00.000Z"), value: 200 },
    { date: new Date("2026-01-01T00:00:00.000Z"), value: 800 },
    { date: new Date(now), value: 1000 },
  ];

  it("keeps the full month series for 1m", () => {
    const { prices, timestamps } = buildAnalyticsPortfolioChartSeries(history, "1m", now);
    expect(prices.length).toBe(history.length);
    expect(timestamps[0]).toBe(history[0].date.getTime());
  });

  it("filters 6m to roughly the last six months", () => {
    const { prices } = buildAnalyticsPortfolioChartSeries(history, "6m", now);
    expect(prices).toEqual([800, 1000]);
  });

  it("filters 5y to roughly the last five years", () => {
    const { prices } = buildAnalyticsPortfolioChartSeries(history, "5y", now);
    expect(prices).toEqual([100, 200, 800, 1000]);
  });
});
