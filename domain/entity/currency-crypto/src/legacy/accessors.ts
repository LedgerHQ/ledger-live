// Static accessors over `CRYPTO_CURRENCIES_REGISTRY`. These become selectors over a dynamic
// currency slice once the registry stops being a compile-time constant — see `./FUTURE.md`.
import { CRYPTO_CURRENCIES_REGISTRY, CRYPTO_CURRENCY_ALIASES } from "../registry";
import type { CryptoCurrency } from "../schema";

// --- module-private lookup structures (built once at load) ---

const allCurrencies: CryptoCurrency[] = Object.values(CRYPTO_CURRENCIES_REGISTRY);
const prodCurrencies: CryptoCurrency[] = allCurrencies.filter(c => !c.isTestnetFor && !c.delisted);

const byScheme: Record<string, CryptoCurrency> = Object.fromEntries(
  allCurrencies.map(c => [c.scheme, c]),
);

// Mirrors the LIVE-33115 keyword tiebreak from registerCurrencyInStore: when two prod currencies
// share a ticker, prefer the one whose keywords list contains that ticker (case-insensitive).
const byTicker: Record<string, CryptoCurrency> = {};
for (const c of allCurrencies) {
  if (c.isTestnetFor) continue;
  const existing = byTicker[c.ticker];
  const hasTickerAsKeyword = Boolean(
    c.keywords?.some(k => k.toLowerCase() === c.ticker.toLowerCase()),
  );
  if (!existing || hasTickerAsKeyword) byTicker[c.ticker] = c;
}

/**
 * Resolve a crypto currency by its id, returning `undefined` when unknown.
 *
 * Mirrors the legacy `@ledgerhq/cryptoassets` `findCryptoCurrencyById`: it also resolves the few
 * legacy alias keys (source-literal key ≠ `.id`, e.g. "osmosis" → osmo) via
 * {@link CRYPTO_CURRENCY_ALIASES}, so it stays a drop-in for callers that pass those keys.
 */
export function findCryptoCurrencyById(id: string): CryptoCurrency | undefined {
  if (Object.hasOwn(CRYPTO_CURRENCIES_REGISTRY, id)) {
    return CRYPTO_CURRENCIES_REGISTRY[id];
  }
  if (Object.hasOwn(CRYPTO_CURRENCY_ALIASES, id)) {
    return CRYPTO_CURRENCIES_REGISTRY[CRYPTO_CURRENCY_ALIASES[id]];
  }
  return undefined;
}

/**
 * Resolve a crypto currency by its id, throwing when unknown.
 *
 * Matches the legacy `@ledgerhq/cryptoassets` `getCryptoCurrencyById` throw semantics (and message)
 * so it is a drop-in replacement.
 */
export function getCryptoCurrencyById(id: string): CryptoCurrency {
  const currency = findCryptoCurrencyById(id);
  if (!currency) {
    throw new Error(`currency with id "${id}" not found`);
  }
  return currency;
}

/**
 * Whether a crypto currency id (or legacy alias key) is known.
 */
export function hasCryptoCurrencyId(id: string): boolean {
  return findCryptoCurrencyById(id) !== undefined;
}

/** All known crypto currencies. Pass `true` to include testnets. */
export function listCryptoCurrencies(withDevCrypto = false): CryptoCurrency[] {
  return withDevCrypto ? allCurrencies : prodCurrencies;
}

/** First crypto currency matching the predicate (searches all currencies including testnets). */
export function findCryptoCurrency(f: (c: CryptoCurrency) => boolean): CryptoCurrency | undefined {
  return allCurrencies.find(f);
}

/** Look up a crypto currency by its URI scheme (e.g. `"bitcoin"`). Returns `undefined` when `scheme` is `undefined` or unknown. */
export function findCryptoCurrencyByScheme(scheme: string | undefined): CryptoCurrency | undefined {
  if (scheme === undefined) return undefined;
  return byScheme[scheme];
}

/**
 * Look up a crypto currency by its ticker symbol.
 *
 * @deprecated Tickers are not unique across currencies, so the result is ambiguous and arbitrary.
 * Look up by id with {@link findCryptoCurrencyById} instead.
 */
export function findCryptoCurrencyByTicker(ticker: string): CryptoCurrency | undefined {
  return byTicker[ticker];
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

/** Search for a crypto currency across keywords, name, id, ticker, and manager app name. */
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
