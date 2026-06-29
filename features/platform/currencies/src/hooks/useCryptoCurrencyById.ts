import { useMemo } from "react";
import { CRYPTO_CURRENCIES_REGISTRY, type CryptoCurrency } from "@domain/entity-currency-crypto";

/**
 * Returns the statically-defined crypto currency for an id, or `undefined` when
 * the id is unknown.
 *
 * Reads the domain registry directly (currencies are static, not stored). When
 * LIVE-31917 lands a memoized `getCryptoCurrencyById` selector, swap the body for it.
 */
export function useCryptoCurrencyById(id: string | undefined): CryptoCurrency | undefined {
  return useMemo(() => (id ? CRYPTO_CURRENCIES_REGISTRY[id] : undefined), [id]);
}
