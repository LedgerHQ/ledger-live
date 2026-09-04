import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { Currency } from "@domain/entity-currency";
import { counterValuesApi } from "../counterValues/state-manager/api";

// sort currencies by ids provided
export const sortCurrenciesByIds = <C extends Currency>(currencies: C[], ids: string[]): C[] => {
  const currenciesById = new Map();
  for (const c of currencies) {
    if (c.type !== "FiatCurrency") {
      currenciesById.set(c.id, c);
    }
  }
  const all = new Set<C>();
  for (const id of ids) {
    const currency = currenciesById.get(id);
    if (currency) {
      all.add(currency);
    }
  }
  for (const cur of currencies) {
    all.add(cur);
  }
  return [...all];
};

// Returns an async sorter that fetches the CVS marketcap ranking via the
// provided Redux dispatch and reorders currencies accordingly.
// Falls back to original order when the query fails.
export function makeSortCurrenciesByMarketcap(
  dispatch: ThunkDispatch<unknown, unknown, UnknownAction>,
): <C extends Currency>(currencies: C[]) => Promise<C[]> {
  return async <C extends Currency>(currencies: C[]): Promise<C[]> => {
    try {
      const ids = await dispatch(
        counterValuesApi.endpoints.getCounterValueIdsSortedByMarketCap.initiate(),
      ).unwrap();
      return sortCurrenciesByIds(currencies, ids);
    } catch {
      return currencies;
    }
  };
}
