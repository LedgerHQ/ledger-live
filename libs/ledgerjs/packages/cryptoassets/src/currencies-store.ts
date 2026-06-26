import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

/**
 * Internal, derived shape consumed by the accessors in `currencies.ts`.
 *
 * It is **not** the injection contract: callers pass a `CryptoCurrency[]` to
 * {@link setCryptoCurrenciesStore} and the indices/arrays below are derived here, so they cannot
 * drift out of sync. The lookup algorithms (by id/ticker/scheme/keyword/manager-app, predicate
 * search and the dev filtering of `listCryptoCurrencies`) live in `currencies.ts` and
 * run over whichever store is active.
 */
export type CryptoCurrenciesStore = {
  cryptocurrenciesById: Record<string, CryptoCurrency>;
  cryptocurrenciesByScheme: Record<string, CryptoCurrency>;
  cryptocurrenciesByTicker: Record<string, CryptoCurrency>;
  /** All currencies (dev + prod). */
  cryptocurrenciesArray: CryptoCurrency[];
  /** Prod-only currencies. */
  prodCryptoArray: CryptoCurrency[];
};

declare global {
  interface GlobalThis {
    __ledgerCryptoCurrenciesStore?: CryptoCurrenciesStore;
  }
}

function emptyCurrenciesStore(): CryptoCurrenciesStore {
  return {
    // Null-prototype maps: keys come from external (injected) currency data, so an id/scheme/ticker
    // like "__proto__" or "constructor" stays a plain own key and can't mutate the prototype chain.
    cryptocurrenciesById: Object.create(null),
    cryptocurrenciesByScheme: Object.create(null),
    cryptocurrenciesByTicker: Object.create(null),
    cryptocurrenciesArray: [],
    prodCryptoArray: [],
  };
}

/**
 * Indexes a single currency into `store`, deriving every map and array from it.
 *
 * This is the one place the derived structures are built — shared by the bundled registry
 * (`currencies.ts`) and by {@link buildCryptoCurrenciesStore}.
 */
export function registerCurrencyInStore(
  store: CryptoCurrenciesStore,
  currency: CryptoCurrency,
): void {
  store.cryptocurrenciesById[currency.id] = currency;
  store.cryptocurrenciesByScheme[currency.scheme] = currency;

  if (!currency.isTestnetFor) {
    const currencyAlreadySet = store.cryptocurrenciesByTicker[currency.ticker];
    const tickerLower = currency.ticker.toLowerCase();
    const currencyHasTickerInKeywords = Boolean(
      currency.keywords?.some(k => k.toLowerCase() === tickerLower),
    );

    if (
      !currencyAlreadySet ||
      // In case of duplicates, we prioritize currencies with the ticker as a keyword of the currency
      (currencyAlreadySet && currencyHasTickerInKeywords)
    ) {
      store.cryptocurrenciesByTicker[currency.ticker] = currency;
    }
    store.prodCryptoArray.push(currency);
  }

  store.cryptocurrenciesArray.push(currency);
}

function buildCryptoCurrenciesStore(currencies: CryptoCurrency[]): CryptoCurrenciesStore {
  const store = emptyCurrenciesStore();
  for (const currency of currencies) {
    registerCurrencyInStore(store, currency);
  }
  return store;
}

/**
 * Injects the crypto-currency registry from the canonical currency list.
 * This should be called once during application initialization.
 *
 * The caller provides the currencies; the by-id/ticker/scheme indices and the dev/prod arrays are
 * derived here so they stay consistent by construction. `aliases` maps a legacy alias key to a
 * canonical id (e.g. `{ osmosis: "osmo" }`) so id lookups by that alias keep resolving, as they do
 * against the bundled map which exposes the same legacy aliases.
 *
 * Uses globalThis to ensure a single shared reference across all module instances,
 * which is critical when coin-modules are lazy-loaded and may resolve to separate
 * module copies.
 */
export function setCryptoCurrenciesStore(
  currencies: CryptoCurrency[],
  aliases: Record<string, string> = {},
): void {
  const store = buildCryptoCurrenciesStore(currencies);
  for (const [alias, id] of Object.entries(aliases)) {
    // Fail fast on a misconfigured alias map at injection time, rather than silently dropping it and
    // letting a later getCryptoCurrencyById(alias) throw an opaque "not found" at runtime.
    const currency = store.cryptocurrenciesById[id];
    if (!currency) {
      throw new Error(
        `setCryptoCurrenciesStore: alias "${alias}" points to unknown currency id "${id}"`,
      );
    }
    // The by-id map is null-prototype and only ever holds defined currencies, so a direct read is a
    // safe own-key existence check (no prototype traversal) — and avoids Object.hasOwn, which needs a
    // newer lib target than this package compiles against.
    if (store.cryptocurrenciesById[alias]) {
      throw new Error(
        `setCryptoCurrenciesStore: alias "${alias}" collides with an existing currency id`,
      );
    }
    store.cryptocurrenciesById[alias] = currency;
  }
  globalThis.__ledgerCryptoCurrenciesStore = store;
}

/**
 * Returns the injected crypto-currency registry store, or `undefined` when none has been set.
 *
 * Unlike `getCryptoAssetsStore`, this never throws: callers fall back to the bundled data,
 * so accessors invoked at module-evaluation time (before any injection) stay safe.
 */
export function getInjectedCurrenciesStore(): CryptoCurrenciesStore | undefined {
  return globalThis.__ledgerCryptoCurrenciesStore;
}
