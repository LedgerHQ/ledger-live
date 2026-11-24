import type { MarketChartResponse } from "./types";
import { MarketChartResponseSchema } from "./schema";

export const mockMarketChartResponse: MarketChartResponse = {
  values: [
    [1779861598000, 1781.81],
    [1779861897000, 1782.65],
  ],
};

MarketChartResponseSchema.parse(mockMarketChartResponse);
