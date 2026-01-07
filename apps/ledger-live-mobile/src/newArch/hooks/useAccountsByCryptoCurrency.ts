import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { shallowEqual } from "react-redux";
import type {
  CryptoOrTokenCurrency,
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import {
  accountsByCryptoCurrencyScreenSelector,
  flattenAccountsByCryptoCurrencyScreenSelector,
} from "~/reducers/accounts";

/**
 * Hook to get accounts by crypto currency.
 *
 * @param currency
 * The currency to get accounts for.
 *
 * @returns
 * The accounts for the currency.
 */
export function useAccountsByCryptoCurrency(currency: CryptoOrTokenCurrency) {
  const selector = useMemo(() => accountsByCryptoCurrencyScreenSelector(currency), [currency]);
  return useSelector(selector, shallowEqual);
}

/**
 * Hook to get flattened accounts by crypto currency.
 *
 * @param currency
 * The currency to get flattened accounts for.
 *
 * @returns
 * The flattened accounts for the currency.
 */
export function useFlattenAccountsByCryptoCurrency(currency?: CryptoCurrency | TokenCurrency) {
  const selector = useMemo(
    () => flattenAccountsByCryptoCurrencyScreenSelector(currency),
    [currency],
  );
  return useSelector(selector, shallowEqual);
}
