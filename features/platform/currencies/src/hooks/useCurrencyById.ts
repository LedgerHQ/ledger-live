import { useMemo } from "react";
import { CRYPTO_CURRENCIES_REGISTRY, type CryptoCurrency } from "@domain/entity-currency-crypto";
import { useFindTokenByIdQuery } from "@domain/api-currency-token";
import type { TokenCurrency } from "@domain/entity-currency-token";

export type CurrencyResult = {
  currency: CryptoCurrency | TokenCurrency | undefined;
  loading: boolean;
  error: unknown;
};

/**
 * Resolves a currency (crypto or token) by id.
 *
 * Checks the static crypto registry first; only queries the CAL API when the id
 * is not a known crypto currency.
 */
export function useCurrencyById(id: string): CurrencyResult {
  const maybeCryptoCurrency = useMemo(
    () => (id ? CRYPTO_CURRENCIES_REGISTRY[id] : undefined),
    [id],
  );
  const tokenResult = useFindTokenByIdQuery({ id }, { skip: !!maybeCryptoCurrency || !id });

  if (maybeCryptoCurrency) {
    return { currency: maybeCryptoCurrency, loading: false, error: null };
  }
  return {
    currency: tokenResult.data,
    loading: tokenResult.isLoading,
    error: tokenResult.error ?? null,
  };
}
