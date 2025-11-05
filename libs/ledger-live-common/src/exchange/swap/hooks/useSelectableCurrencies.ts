import { useEffect, useState } from "react";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { getCryptoAssetsStore } from "../../../bridge/crypto-assets/index";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const useSelectableCurrencies = ({
  allCurrencies,
}: {
  allCurrencies: string[];
}): (TokenCurrency | CryptoCurrency)[] => {
  const [currencies, setCurrencies] = useState<(TokenCurrency | CryptoCurrency)[]>([]);

  useEffect(() => {
    const loadCurrencies = async () => {
      const results = await Promise.all(
        allCurrencies.map(async id => {
          // Try token first, then crypto currency
          const token = await getCryptoAssetsStore().findTokenById(id);
          if (token) return token;

          const crypto = findCryptoCurrencyById(id);
          return crypto;
        }),
      );

      const validCurrencies = results.filter(Boolean) as (TokenCurrency | CryptoCurrency)[];
      setCurrencies(validCurrencies);
    };

    loadCurrencies();
  }, [allCurrencies]);

  return currencies;
};
