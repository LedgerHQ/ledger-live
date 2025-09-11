import { createSelector } from "@reduxjs/toolkit";
import { InterestRate } from "../entities";

interface ApiState {
  assetsDataApi?: {
    queries?: Record<string, QueryCacheEntry>;
  };
}

interface QueryCacheEntry {
  data?: {
    pages?: Array<{
      interestRates?: Record<string, InterestRate>;
    }>;
  };
}

export const selectInterestRateByCurrency: (
  state: ApiState,
  currencyId: string,
) => InterestRate | undefined = createSelector(
  [
    (state: ApiState) => state.assetsDataApi?.queries ?? {},
    (_state: ApiState, currencyId: string) => currencyId,
  ],
  (queries, currencyId): InterestRate | undefined => {
    for (const query of Object.values(queries)) {
      const pages = query.data?.pages;
      if (!pages) continue;

      for (const page of pages) {
        const rate = page.interestRates?.[currencyId];
        if (rate) return rate;
      }
    }

    return undefined;
  },
);
