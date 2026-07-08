// Static accessors over `CRYPTO_CURRENCIES_REGISTRY`. These become selectors over a dynamic
// currency slice once the registry stops being a compile-time constant — see `./FUTURE.md`.
import { CRYPTO_CURRENCIES_REGISTRY, CRYPTO_CURRENCY_ALIASES } from "../registry";
import type { CryptoCurrency } from "../schema";

/** Resolve a crypto currency by its id, returning `undefined` when unknown. */
export function findCryptoCurrencyById(id: string): CryptoCurrency | undefined {
  if (Object.hasOwn(CRYPTO_CURRENCIES_REGISTRY, id)) {
    return CRYPTO_CURRENCIES_REGISTRY[id];
  }
  if (Object.hasOwn(CRYPTO_CURRENCY_ALIASES, id)) {
    return CRYPTO_CURRENCIES_REGISTRY[CRYPTO_CURRENCY_ALIASES[id]];
  }
  return undefined;
}

/** Resolve a crypto currency by its id, throwing when unknown. */
export function getCryptoCurrencyById(id: string): CryptoCurrency {
  const currency = findCryptoCurrencyById(id);
  if (!currency) {
    throw new Error(`currency with id "${id}" not found`);
  }
  return currency;
}

/** Whether a crypto currency id (or legacy alias key) is known. */
export function hasCryptoCurrencyId(id: string): boolean {
  return findCryptoCurrencyById(id) !== undefined;
}

/**
 * Return all known crypto currencies.
 *
 * Pass `withDevCrypto = true` to include testnet entries (those with a non-null `isTestnetFor`
 * field). Delisted currencies are always excluded from the default result; pass `true` to include
 * them too — the full unfiltered list is returned.
 */
export function listCryptoCurrencies(withDevCrypto = false): CryptoCurrency[] {
  return withDevCrypto ? allCurrencies : prodCurrencies;
}

/**
 * Return the first crypto currency (including testnets and delisted entries) that satisfies the
 * predicate, or `undefined` when none matches.
 */
export function findCryptoCurrency(f: (c: CryptoCurrency) => boolean): CryptoCurrency | undefined {
  return allCurrencies.find(f);
}

/**
 * Resolve a crypto currency by its URI scheme (e.g. `"bitcoin"`, `"ethereum"`), returning
 * `undefined` when no match is found or when `scheme` is `undefined`.
 *
 * Look-up is O(1) against a pre-built index; schemes are unique across the registry.
 */
export function findCryptoCurrencyByScheme(scheme: string | undefined): CryptoCurrency | undefined {
  if (scheme === undefined) return undefined;
  return Object.hasOwn(byScheme, scheme) ? byScheme[scheme] : undefined;
}

/**
 * Resolve a crypto currency by its ticker symbol (e.g. `"BTC"`, `"ETH"`), returning `undefined`
 * when unknown.
 *
 * When two non-testnet currencies share a ticker, the one whose `keywords` list contains that
 * ticker (case-insensitive) wins. This matches the tiebreak introduced in and applied
 * by `registerCurrencyInStore` in `@ledgerhq/cryptoassets`.
 *
 * @deprecated Tickers are not globally unique — the result can be ambiguous. Prefer
 * {@link findCryptoCurrencyById} when the currency id is available.
 */
export function findCryptoCurrencyByTicker(ticker: string): CryptoCurrency | undefined {
  return Object.hasOwn(byTicker, ticker) ? byTicker[ticker] : undefined;
}

/**
 * Search for a crypto currency by a free-form keyword string.
 *
 * The search is tried against each strategy in `tests` in order; the first match wins. The default
 * order is: `keywords` field → display `name` → currency `id` → `ticker` → manager app name.
 * Pass a custom `tests` array to restrict or reorder the strategies.
 *
 * Matching is case-insensitive and ignores spaces.
 */
export function findCryptoCurrencyByKeyword(
  keyword: string,
  tests: ReadonlyArray<keyof typeof keywordTests> = ["keywords", "name", "id", "ticker", "manager"],
): CryptoCurrency | undefined {
  const search = keyword.replace(/ /, "").toLowerCase();
  for (const test of tests) {
    const match = keywordTests[test]?.(search);
    if (match) return match;
  }
}

function findByManagerApp(managerAppName: string): CryptoCurrency | undefined {
  const search = managerAppName.replace(/ /, "").toLowerCase();
  return (
    allCurrencies.find(c => c.managerAppName === managerAppName) ||
    allCurrencies.find(
      c => Boolean(c.managerAppName) && c.managerAppName!.replace(/ /, "").toLowerCase() === search,
    )
  );
}

const allCurrencies: CryptoCurrency[] = Object.values(CRYPTO_CURRENCIES_REGISTRY);

const prodCurrencies: CryptoCurrency[] = allCurrencies.filter(c => !c.isTestnetFor && !c.delisted);

const byScheme: Record<string, CryptoCurrency> = Object.fromEntries(
  allCurrencies.map(c => [c.scheme, c]),
);

const byTicker: Record<string, CryptoCurrency> = {};
for (const c of allCurrencies) {
  if (c.isTestnetFor) continue;
  const existing = byTicker[c.ticker];
  const hasTickerAsKeyword = Boolean(
    c.keywords?.some(k => k.toLowerCase() === c.ticker.toLowerCase()),
  );
  if (!existing || hasTickerAsKeyword) byTicker[c.ticker] = c;
}

const keywordTests = {
  keywords: (s: string) =>
    findCryptoCurrency(c =>
      Boolean(c.keywords?.map(k => k.replace(/ /, "").toLowerCase()).includes(s)),
    ),
  name: (s: string) => findCryptoCurrency(c => c.name.replace(/ /, "").toLowerCase() === s),
  id: (s: string) => findCryptoCurrencyById(s.toLowerCase()),
  ticker: (s: string) => findCryptoCurrencyByTicker(s.toUpperCase()),
  manager: (s: string) => findByManagerApp(s),
} as const;
