import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useEffect } from "react";
import { currenciesByMarketcap } from "../../../currencies";

// Pick a default currency target if none are selected.
export const usePickDefaultCurrency = (
  currencies: CryptoOrTokenCurrency[],
  currency: CryptoOrTokenCurrency | null | undefined,
  setCurrency: (currency: CryptoOrTokenCurrency) => void,
): void => {
  useEffect(() => {
    // Keep the same currency target if it is still valid.
    const isCurrencyValid = currency && currencies.indexOf(currency) >= 0;
    if (!currency || !isCurrencyValid) {
      const defaultCurrency = currencies.find(
        currency => currency.id === "ethereum" || currency.id === "bitcoin",
      );

      if (defaultCurrency) {
        setCurrency(defaultCurrency);
      } else if (currencies.length > 0) {
        currenciesByMarketcap(currencies).then(sortedCurrencies => {
          setCurrency(sortedCurrencies[0]);
        });
      }
    }
  }, [currency, currencies, setCurrency]);
};
