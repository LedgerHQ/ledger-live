import {
  ChartDataPointSchema,
  MarketChartApiResponseSchema,
  MarketChartRangeSchema,
  MarketCoinDataChartSchema,
  SupportedChartCounterCurrenciesSchema,
} from "./schema";
import { mockMarketChartApiResponse } from "./schema.mock";

describe("MarketChartApiResponseSchema", () => {
  it("accepts the mock", () => {
    expect(MarketChartApiResponseSchema.parse(mockMarketChartApiResponse())).toEqual(
      mockMarketChartApiResponse(),
    );
  });

  it("rejects a missing values field", () => {
    expect(MarketChartApiResponseSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a malformed point", () => {
    expect(MarketChartApiResponseSchema.safeParse({ values: [[1, "2"]] }).success).toBe(false);
  });
});

describe("ChartDataPointSchema", () => {
  it("rejects a point of the wrong length", () => {
    expect(ChartDataPointSchema.safeParse([1, 2, 3]).success).toBe(false);
  });
});

describe("MarketChartRangeSchema", () => {
  it("accepts a known range and rejects an unknown one", () => {
    expect(MarketChartRangeSchema.safeParse("24h").success).toBe(true);
    expect(MarketChartRangeSchema.safeParse("2y").success).toBe(false);
  });
});

describe("MarketCoinDataChartSchema", () => {
  it("accepts points keyed by range", () => {
    expect(MarketCoinDataChartSchema.safeParse({ "24h": [[1, 2]] }).success).toBe(true);
  });
});

describe("SupportedChartCounterCurrenciesSchema", () => {
  it("accepts fiat tickers and coin ids", () => {
    expect(SupportedChartCounterCurrenciesSchema.safeParse(["EUR", "bitcoin"]).success).toBe(true);
  });

  it("rejects an empty entry", () => {
    expect(SupportedChartCounterCurrenciesSchema.safeParse(["EUR", ""]).success).toBe(false);
  });
});
