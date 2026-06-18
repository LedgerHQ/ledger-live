import type { MarketCoinDataChart } from "@ledgerhq/live-common/market/utils/types";
import { buildAssetDetailChartSeries } from "../buildAssetDetailChartSeries";

describe("buildAssetDetailChartSeries", () => {
  it("returns resampled prices and timestamps for a range", () => {
    const chartData: MarketCoinDataChart = {
      "1d": [
        [1_000, 100],
        [2_000, 110],
        [3_000, 120],
      ],
    };

    const { prices, timestamps } = buildAssetDetailChartSeries({
      chartData,
      selectedRange: "1d",
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

    const { prices } = buildAssetDetailChartSeries({
      chartData,
      selectedRange: "all",
      ath: 500,
      athTime: 1_500,
      atl: 50,
      atlTime: 500,
    });

    expect(prices).toContain(500);
    expect(prices).toContain(50);
  });
});
