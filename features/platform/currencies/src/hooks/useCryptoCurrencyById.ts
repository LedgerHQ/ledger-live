import { useMemo } from "react";
import { CRYPTO_CURRENCIES_REGISTRY, type CryptoCurrency } from "@domain/entity-currency-crypto";

/**
 * Returns the statically-defined crypto currency for an id, or `undefined` when
 * the id is unknown.
 *
 * Reads the domain registry directly (currencies are static, not stored). Swap the
 * body for a memoized `getCryptoCurrencyById` selector once one lands.
 */
export function useCryptoCurrencyById(id: string | undefined): CryptoCurrency | undefined {
  return useMemo(() => (id ? CRYPTO_CURRENCIES_REGISTRY[id] : undefined), [id]);
}
