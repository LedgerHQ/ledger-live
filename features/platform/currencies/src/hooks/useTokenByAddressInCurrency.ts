import { useFindTokenByAddressInCurrencyQuery } from "@domain/api-currency-token";
import type { TokenCurrency } from "@domain/entity-currency-token";

export type TokenResult = {
  token: TokenCurrency | undefined;
  loading: boolean;
  error: unknown;
};

/**
 * Looks up a token by its contract address and parent currency network.
 * Maps to the CAL `findTokenByAddressInCurrency` query.
 */
export function useTokenByAddressInCurrency(
  address: string,
  currencyId: string,
  options?: { skip?: boolean },
): TokenResult {
  const result = useFindTokenByAddressInCurrencyQuery(
    { contract_address: address, network: currencyId },
    options,
  );
  return {
    token: result.data,
    loading: result.isLoading,
    error: result.error ?? null,
  };
}
