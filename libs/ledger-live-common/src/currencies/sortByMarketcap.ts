import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network";
import { getEnv } from "@shared/env";
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

const fetchMarketcapIds: () => Promise<string[]> = makeLRUCache(async () => {
  const { data } = await network<string[]>({
    method: "GET",
    url: `${getEnv("LEDGER_COUNTERVALUES_API")}/v3/supported/crypto`,
  });
  return data;
});

// Async sort for non-React callers (e.g. listApps).
// Rejects on CVS failure, propagating the error to the caller.
export function sortCurrenciesByDada<C extends Currency>(currencies: C[]): Promise<C[]> {
  return fetchMarketcapIds().then(ids => sortCurrenciesByIds(currencies, ids));
}
