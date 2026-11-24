import type { GlobalMarketDataResponse } from "./types";
import { GlobalMarketDataResponseSchema } from "./schema";

export const mockGlobalMarketDataResponse: GlobalMarketDataResponse = {
  marketCap: 2_450_000_000_000,
  percentageChanges: {
    "1d": -0.0171,
  },
};

GlobalMarketDataResponseSchema.parse(mockGlobalMarketDataResponse);
