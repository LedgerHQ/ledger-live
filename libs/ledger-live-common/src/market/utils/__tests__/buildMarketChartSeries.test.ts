import type { MarketCoinDataChart } from "../types";
import { buildMarketChartSeries } from "../buildMarketChartSeries";

const HOUR_MS = 60 * 60_000;

describe("buildMarketChartSeries", () => {
  it("returns resampled prices and timestamps for a range", () => {
    const chartData: MarketCoinDataChart = {
      "1d": [
        [1_000, 100],
        [2_000, 110],
        [3_000, 120],
      ],
    };

    const { prices, timestamps } = buildMarketChartSeries({
      chartData,
      range: "1d",
      targetIntervalMs: 5 * 60_000,
    });

    expect(prices.length).toBeGreaterThan(0);
    expect(timestamps).toHaveLength(prices.length);
    expect(prices[0]).toBe(100);
    expect(prices[prices.length - 1]).toBe(120);
  });

  it("injects market extrema on the all-time range", () => {
    const chartData: MarketCoinDataChart = {
      all: [
        [1_000, 100],
        [2_000, 200],
      ],
    };

    const { prices } = buildMarketChartSeries({
      chartData,
      range: "all",
      targetIntervalMs: HOUR_MS,
      ath: 500,
      athTime: 1_500,
      atl: 50,
      atlTime: 500,
    });

    expect(prices).toContain(500);
    expect(prices).toContain(50);
  });

  it("drops non-finite chart points before building the series", () => {
    const chartData: MarketCoinDataChart = {
      "1d": [
        [1_000, 100],
        [2_000, Number.NaN],
        [Number.NaN, 110],
        [3_000, Number.POSITIVE_INFINITY],
        [4_000, 130],
      ],
    };

    const { prices, timestamps } = buildMarketChartSeries({
      chartData,
      range: "1d",
      targetIntervalMs: 5 * 60_000,
    });

    expect(prices).toEqual([100, 130]);
    expect(timestamps).toEqual([1_000, 4_000]);
  });

  it("returns an empty series when every chart point is non-finite", () => {
    const chartData: MarketCoinDataChart = {
      "1d": [
        [1_000, Number.NaN],
        [2_000, Number.POSITIVE_INFINITY],
      ],
    };

    const { prices, timestamps } = buildMarketChartSeries({
      chartData,
      range: "1d",
      targetIntervalMs: 5 * 60_000,
    });

    expect(prices).toEqual([]);
    expect(timestamps).toEqual([]);
  });
});
