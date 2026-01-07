import type { TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "./currencies";
import { cryptoAssetsApi } from "./cal-client/state-manager/api";

export type TokenResult = {
  token: TokenCurrency | undefined;
  loading: boolean;
  error: unknown;
};

export type CurrencyResult = {
  currency: CryptoCurrency | TokenCurrency | undefined;
  loading: boolean;
  error: unknown;
};

/**
 * Hook to find a token by its ID
 */
export function useTokenById(id: string): TokenResult {
  const result = cryptoAssetsApi.useFindTokenByIdQuery({ id });
  return {
    token: result.data,
    loading: result.isLoading,
    error: result.error,
  };
}

/**
 * Hook to find a token by its contract address and currency
 */
export function useTokenByAddressInCurrency(address: string, currencyId: string): TokenResult {
  const result = cryptoAssetsApi.useFindTokenByAddressInCurrencyQuery({
    contract_address: address,
    network: currencyId,
  });
  return {
    token: result.data,
    loading: result.isLoading,
    error: result.error,
  };
}

/**
 * Hook to find a currency (crypto or token) by its ID
 */
export function useCurrencyById(id: string): CurrencyResult {
  const maybeCryptoCurrency = findCryptoCurrencyById(id);
  if (maybeCryptoCurrency) {
    return {
      currency: maybeCryptoCurrency,
      loading: false,
      error: null,
    };
  }
  const result = cryptoAssetsApi.useFindTokenByIdQuery({ id });
  return {
    currency: result.data,
    loading: result.isLoading,
    error: result.error,
  };
}
