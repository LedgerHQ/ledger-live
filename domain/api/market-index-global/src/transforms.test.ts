import { ZodError } from "zod";
import { transformGlobalMarketDataResponse } from "./transforms";
import { mockGlobalMarketDataResponse } from "./globalMarketData.mock";

describe("transformGlobalMarketDataResponse", () => {
  it("maps the raw response to the canonical index, converting the 1d ratio to a percentage", () => {
    const result = transformGlobalMarketDataResponse(mockGlobalMarketDataResponse);

    expect(result.marketCap).toBe(2_450_000_000_000);
    expect(result.changePercentage24h).toBeCloseTo(-1.71);
  });

  it("throws on an invalid payload", () => {
    expect(() => transformGlobalMarketDataResponse({ marketCap: 1 })).toThrow(ZodError);
    expect(() => transformGlobalMarketDataResponse(null)).toThrow(ZodError);
  });
});
