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

// DADA coverage is partial: major cryptos, stablecoins and xStocks are ranked;
// unknown currencies fall to the end via the sortCurrenciesByIds fallback.
const fetchMarketcapIdsFromDada: () => Promise<string[]> = makeLRUCache(async () => {
  const { data } = await network<{
    cryptoAssets: Record<string, { assetsIds?: Record<string, string> }>;
    currenciesOrder: { metaCurrencyIds: string[] };
  }>({
    method: "GET",
    url: `${getEnv("DADA_API_PROD")}/assets`,
    params: { product: "lld", minVersion: "1.0.0", pageSize: 100 },
  });
  return data.currenciesOrder.metaCurrencyIds.flatMap(metaId =>
    Object.values(data.cryptoAssets[metaId]?.assetsIds ?? {}),
  );
});

// Async sort for non-React callers (e.g. listApps). Falls back to original
// order on error. DADA coverage is partial; sortCurrenciesByIds appends unknowns.
export function sortCurrenciesByDada<C extends Currency>(currencies: C[]): Promise<C[]> {
  return fetchMarketcapIdsFromDada().then(
    ids => sortCurrenciesByIds(currencies, ids),
    () => currencies,
  );
}
