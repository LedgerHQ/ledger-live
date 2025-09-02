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
      try {
        if (query?.data?.pages && Array.isArray(query.data.pages)) {
          for (const page of query.data.pages) {
            if (page?.interestRates?.[currencyId]) {
              return page.interestRates[currencyId];
            }
          }
        }
      } catch {
        continue;
      }
    }
    return undefined;
  },
);
