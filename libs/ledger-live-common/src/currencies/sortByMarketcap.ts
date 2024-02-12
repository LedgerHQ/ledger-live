import { makeLRUCache } from "@ledgerhq/live-network/cache";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import api from "@ledgerhq/live-countervalues/api/index";

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

let marketcapIdsCache;
export const getMarketcapIdsSync = () => marketcapIdsCache;

export const fetchMarketcapIds: () => Promise<string[]> = makeLRUCache(() =>
  api.fetchIdsSortedByMarketcap().then(ids => {
    marketcapIdsCache = ids;
    return ids;
  }),
);

export const currenciesByMarketcap = <C extends Currency>(currencies: C[]): Promise<C[]> =>
  fetchMarketcapIds().then(
    ids => sortCurrenciesByIds(currencies, ids),
    () => currencies,
  );
