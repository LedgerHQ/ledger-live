import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network";
import { getEnv } from "@shared/env";
import { TICKER_TO_ID_AND_VALUE } from "@ledgerhq/live-countervalues/mock";
import type { Currency } from "@domain/entity-currency";

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

/**
 * @deprecated live-countervalues-react context unify a single fetch of this API data, so you may want to just use `useCurrenciesByMarketcap` instead OR get the marketcapIds from that context and directly use sortByCurrenciesById function
 */
export const fetchMarketcapIds: () => Promise<string[]> = makeLRUCache(async () => {
  if (getEnv("MOCK_COUNTERVALUES")) {
    return Object.values(TICKER_TO_ID_AND_VALUE).map(([id]) => id);
  }
  const { data } = await network<string[]>({
    method: "GET",
    url: `${getEnv("LEDGER_COUNTERVALUES_API")}/v3/supported/crypto`,
  });
  return data;
});

/**
 * @deprecated live-countervalues-react context unify a single fetch of this API data, so you may want to just use `useCurrenciesByMarketcap` instead OR get the marketcapIds from that context and directly use sortByCurrenciesById function
 */
export const currenciesByMarketcap = <C extends Currency>(currencies: C[]): Promise<C[]> =>
  fetchMarketcapIds().then(
    ids => sortCurrenciesByIds(currencies, ids),
    () => currencies,
  );
