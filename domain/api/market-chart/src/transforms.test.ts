import { ZodError } from "zod";
import { mockMarketChartResponse } from "./marketChart.mock";
import {
  transformMarketChartResponse,
  transformSupportedChartCounterCurrencies,
} from "./transforms";

describe("transformMarketChartResponse", () => {
  it("keys the values by the requested range", () => {
    expect(transformMarketChartResponse(mockMarketChartResponse, "7d")).toEqual({
      "7d": mockMarketChartResponse.values,
    });
  });

  it("throws on an invalid payload", () => {
    expect(() => transformMarketChartResponse({ values: [["x", 1]] }, "24h")).toThrow(ZodError);
    expect(() => transformMarketChartResponse(null, "24h")).toThrow(ZodError);
  });
});

describe("transformSupportedChartCounterCurrencies", () => {
  it("lowercases every entry", () => {
    expect(transformSupportedChartCounterCurrencies(["EUR", "bitcoin", "USD"])).toEqual([
      "eur",
      "bitcoin",
      "usd",
    ]);
  });

  it("throws on an empty entry", () => {
    expect(() => transformSupportedChartCounterCurrencies(["eur", ""])).toThrow(ZodError);
  });
});
