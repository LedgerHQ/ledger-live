import { useCallback } from "react";
import { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { isCurrencySupported } from "@ledgerhq/coin-framework/currencies/support";
import { useCurrenciesUnderFeatureFlag } from "./useCurrenciesUnderFeatureFlag";

/**
 * Hook that returns a predicate function to check if a currency or token is accepted.
 * A currency is accepted if:
 * - It is supported by the platform (via isCurrencySupported)
 * - It is not deactivated by a feature flag
 *
 * For tokens, the parent currency is checked instead.
 */
export function useAcceptedCurrency() {
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();

  const isAcceptedCurrency = useCallback(
    (currencyOrToken: CryptoOrTokenCurrency): boolean => {
      const currency: CryptoCurrency =
        currencyOrToken.type === "TokenCurrency" ? currencyOrToken.parentCurrency : currencyOrToken;

      return isCurrencySupported(currency) && !deactivatedCurrencyIds.has(currency.id);
    },
    [deactivatedCurrencyIds],
  );

  return isAcceptedCurrency;
}
