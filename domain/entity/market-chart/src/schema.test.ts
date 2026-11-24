import { ChartDataPointSchema, MarketCoinDataChartSchema } from "./schema";

describe("ChartDataPointSchema", () => {
  it("accepts a [timestamp, price] pair", () => {
    expect(ChartDataPointSchema.parse([1779861598000, 1781.81])).toEqual([1779861598000, 1781.81]);
  });

  it("rejects a point with more or fewer than two numbers", () => {
    expect(ChartDataPointSchema.safeParse([1]).success).toBe(false);
    expect(ChartDataPointSchema.safeParse([1, 2, 3]).success).toBe(false);
  });
});

describe("MarketCoinDataChartSchema", () => {
  it("accepts a series keyed by range", () => {
    const series = { "24h": [[1779861598000, 1781.81]] };
    expect(MarketCoinDataChartSchema.parse(series)).toEqual(series);
  });

  it("rejects a series whose values are not points", () => {
    expect(MarketCoinDataChartSchema.safeParse({ "24h": [["not-a-number", 1]] }).success).toBe(
      false,
    );
  });
});
