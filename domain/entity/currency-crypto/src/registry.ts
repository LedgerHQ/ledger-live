import * as currencies from "./currencies";
import type { CryptoCurrency } from "./schema";

/**
 * Pre-built registry of all known crypto currencies, keyed by currency id.
 *
 * Each currency is defined as a statically-typed `CryptoCurrency` object in its
 * own file under `src/currencies/`.
 */
export const CRYPTO_CURRENCIES_REGISTRY: Record<string, CryptoCurrency> = Object.fromEntries(
  Object.values(currencies)
    .filter((c): c is CryptoCurrency => Boolean(c))
    .map(c => [c.id, c]),
);

/**
 * All known currency ids as a constant array.
 *
 * Apps define their own `SUPPORTED_CURRENCY_IDS` as a subset of this.
 * Use this when you need to enumerate or validate against all known currencies.
 */
export const CRYPTO_CURRENCIES_IDS = Object.values(CRYPTO_CURRENCIES_REGISTRY).map(c => c.id);
