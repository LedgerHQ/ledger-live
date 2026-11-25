import { MarketChartApiResponseSchema } from "./schema";
import type { MarketChartApiResponse } from "./types";

export function mockMarketChartApiResponse(
  overrides?: Partial<MarketChartApiResponse>,
): MarketChartApiResponse {
  return MarketChartApiResponseSchema.parse({
    values: [
      [1700000000000, 35000],
      [1700003600000, 35250.5],
    ],
    ...overrides,
  });
}
