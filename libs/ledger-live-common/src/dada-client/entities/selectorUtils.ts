import { createSelector, Selector } from "@reduxjs/toolkit";

export interface ApiState {
  assetsDataApi?: {
    queries?: Record<string, QueryCacheEntry>;
  };
}

export interface QueryCacheEntry {
  data?: {
    pages?: Array<Record<string, unknown>>;
  };
}

/**
 * Generic selector factory for finding data by currency ID in paginated API responses
 * @param dataKey - The key to look for in each page (e.g., 'markets', 'interestRates')
 * @returns A selector function that finds data by currency ID
 */
export function createCurrencyDataSelector<T>(
  dataKey: string,
): Selector<ApiState, T | undefined, [string]> {
  return createSelector(
    [
      (state: ApiState) => state.assetsDataApi?.queries ?? {},
      (_state: ApiState, currencyId: string) => currencyId,
    ],
    (queries, currencyId): T | undefined => {
      for (const query of Object.values(queries)) {
        const pages = query.data?.pages;
        if (!pages) continue;

        for (const page of pages) {
          const data = page[dataKey]?.[currencyId];
          if (data) return data;
        }
      }

      return undefined;
    },
  );
}
