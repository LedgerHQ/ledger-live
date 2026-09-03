import { createSelector } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { sortCurrenciesByIds } from "./sortByMarketcap";
import type { Currency } from "@domain/entity-currency";

// Minimal Redux state shape for the DADA asset query cache.
// Mirrors the runtime layout described in @features/platform-aggregated-assets README.
interface DadaApiState {
  assetsDataApi?: {
    queries?: Record<
      string,
      {
        data?: {
          pages?: Array<{
            currenciesOrder?: { metaCurrencyIds?: string[] };
            cryptoAssets?: Record<string, { assetsIds?: Record<string, string> }>;
          }>;
        };
      }
    >;
  };
}

// createSelector memoises the result so useSelector returns a stable reference
// between store updates, avoiding unnecessary re-renders.
const selectDadaSortedLedgerIds = createSelector(
  (state: DadaApiState) => state.assetsDataApi?.queries,
  (queries): string[] => {
    for (const entry of Object.values(queries ?? {})) {
      const pages = entry.data?.pages;
      if (!pages?.length) continue;

      const ids: string[] = [];
      for (const page of pages) {
        const metaCurrencyIds = page.currenciesOrder?.metaCurrencyIds;
        const cryptoAssets = page.cryptoAssets;
        if (!metaCurrencyIds || !cryptoAssets) continue;
        for (const metaId of metaCurrencyIds) {
          const assetIds = cryptoAssets[metaId]?.assetsIds;
          if (assetIds) ids.push(...Object.values(assetIds));
        }
      }

      if (ids.length > 0) return ids;
    }
    return [];
  },
);

/**
 * Sorts the given currencies by marketcap using DADA's ordering.
 * Falls back to original order while DADA data is not yet in the store.
 */
export function useCurrenciesByMarketcap<C extends Currency>(currencies: C[]): C[] {
  const ids = useSelector(selectDadaSortedLedgerIds);
  return ids.length > 0 ? sortCurrenciesByIds(currencies, ids) : currencies;
}
