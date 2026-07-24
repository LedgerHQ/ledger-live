import type { FiatCurrency } from "@ledgerhq/types-cryptoassets";

/**
 * Internal, derived shape consumed by the accessors in `fiats.ts`.
 *
 * It is **not** the injection contract: callers pass a `FiatCurrency[]` to
 * {@link setFiatCurrenciesStore} and the by-ticker index/array below are derived here, so they
 * cannot drift out of sync. Tickers are unique across the fiat registry, so — unlike the crypto
 * store — there is no scheme/keyword tiebreak and no dev/prod split.
 */
export type FiatCurrenciesStore = {
  fiatCurrenciesByTicker: Record<string, FiatCurrency>;
  fiatCurrenciesArray: FiatCurrency[];
};

declare global {
  interface GlobalThis {
    __ledgerFiatCurrenciesStore?: FiatCurrenciesStore;
  }
}

function emptyFiatCurrenciesStore(): FiatCurrenciesStore {
  return {
    // Null-prototype map: keys come from external (injected) currency data, so a ticker like
    // "__proto__" or "constructor" stays a plain own key and can't mutate the prototype chain.
    fiatCurrenciesByTicker: Object.create(null),
    fiatCurrenciesArray: [],
  };
}

export function buildFiatCurrenciesStore(currencies: FiatCurrency[]): FiatCurrenciesStore {
  const store = emptyFiatCurrenciesStore();
  for (const currency of currencies) {
    store.fiatCurrenciesByTicker[currency.ticker] = currency;
    store.fiatCurrenciesArray.push(currency);
  }
  return store;
}

/**
 * Injects the fiat-currency registry from the canonical currency list.
 * This should be called once during application initialization.
 *
 * The caller only provides the currencies; the by-ticker index and the array are derived here so
 * they stay consistent by construction.
 *
 * Uses globalThis to ensure a single shared reference across all module instances, which is
 * critical when modules are lazy-loaded and may resolve to separate module copies.
 * @deprecated Use @domain/entity-currency-fiat.
 */
export function setFiatCurrenciesStore(currencies: FiatCurrency[]): void {
  globalThis.__ledgerFiatCurrenciesStore = buildFiatCurrenciesStore(currencies);
}

/**
 * Returns the injected fiat-currency registry store, or `undefined` when none has been set.
 *
 * This never throws: callers fall back to the bundled data, so accessors invoked at
 * module-evaluation time (before any injection) stay safe.
 */
export function getInjectedFiatCurrenciesStore(): FiatCurrenciesStore | undefined {
  return globalThis.__ledgerFiatCurrenciesStore;
}
