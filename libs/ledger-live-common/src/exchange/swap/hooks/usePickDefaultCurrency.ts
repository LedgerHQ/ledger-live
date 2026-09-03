import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useEffect } from "react";
import { useCurrenciesByMarketcap } from "../../../currencies/hooks";

// Pick a default currency target if none are selected.
export const usePickDefaultCurrency = (
  currencies: CryptoOrTokenCurrency[],
  currency: CryptoOrTokenCurrency | null | undefined,
  setCurrency: (currency: CryptoOrTokenCurrency) => void,
): void => {
  const sortedCurrencies = useCurrenciesByMarketcap(currencies);

  useEffect(() => {
    // Keep the same currency target if it is still valid.
    const isCurrencyValid = currency && currencies.indexOf(currency) >= 0;
    if (!currency || !isCurrencyValid) {
      const defaultCurrency = sortedCurrencies.find(c => c.id === "ethereum" || c.id === "bitcoin");

      if (defaultCurrency) {
        setCurrency(defaultCurrency);
      } else if (sortedCurrencies.length > 0) {
        setCurrency(sortedCurrencies[0]);
      }
    }
  }, [currency, sortedCurrencies, setCurrency]);
};
