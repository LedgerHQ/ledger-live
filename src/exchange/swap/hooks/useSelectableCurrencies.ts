import { useMemo } from "react";
import {
  CryptoCurrency,
  findCryptoCurrencyById,
  findTokenById,
  TokenCurrency,
} from "@ledgerhq/cryptoassets";

export const useSelectableCurrencies = ({
  allCurrencies,
}: {
  allCurrencies: string[];
}): (TokenCurrency | CryptoCurrency)[] => {
  const currencies = useMemo(() => {
    const tokens = allCurrencies.map(findTokenById).filter(Boolean);
    const cryptoCurrencies = allCurrencies
      .map(findCryptoCurrencyById)
      .filter(Boolean);
    return [...tokens, ...cryptoCurrencies] as (
      | TokenCurrency
      | CryptoCurrency
    )[];
  }, [allCurrencies]);

  return currencies;
};
