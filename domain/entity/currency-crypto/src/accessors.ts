import { CRYPTO_CURRENCIES_REGISTRY, CRYPTO_CURRENCY_ALIASES } from "./registry";
import type { CryptoCurrency } from "./schema";

/**
 * Resolve a crypto currency by its id, returning `undefined` when unknown.
 *
 * Mirrors the legacy `@ledgerhq/cryptoassets` `findCryptoCurrencyById`: it also resolves the few
 * legacy alias keys (source-literal key ≠ `.id`, e.g. "osmosis" → osmo) via
 * {@link CRYPTO_CURRENCY_ALIASES}, so it stays a drop-in for callers that pass those keys.
 */
export function findCryptoCurrencyById(id: string): CryptoCurrency | undefined {
  const direct = CRYPTO_CURRENCIES_REGISTRY[id];
  if (direct) {
    return direct;
  }
  const aliasId = CRYPTO_CURRENCY_ALIASES[id];
  return aliasId ? CRYPTO_CURRENCIES_REGISTRY[aliasId] : undefined;
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
