import { scaleMarketChartData } from "../scaleMarketChartData";
import type { MarketCoinDataChart } from "../types";

describe("scaleMarketChartData", () => {
  const chart: MarketCoinDataChart = {
    "1d": [
      [1, 100],
      [2, 200],
    ],
    "1w": [[3, 50]],
  };

  it("returns the input unchanged when rate === 1", () => {
    expect(scaleMarketChartData(chart, 1)).toBe(chart);
  });

  it("returns undefined when there is no data", () => {
    expect(scaleMarketChartData(undefined, 0.5)).toBeUndefined();
  });

  it("multiplies every value by the rate while preserving timestamps and ranges", () => {
    expect(scaleMarketChartData(chart, 0.5)).toEqual({
      "1d": [
        [1, 50],
        [2, 100],
      ],
      "1w": [[3, 25]],
    });
  });

  it("does not mutate the input", () => {
    const snapshot = JSON.parse(JSON.stringify(chart));
    scaleMarketChartData(chart, 2);
    expect(chart).toEqual(snapshot);
  });
});
