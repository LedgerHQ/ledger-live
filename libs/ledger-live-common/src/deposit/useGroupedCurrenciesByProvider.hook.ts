import { GroupedCurrencies } from "./type";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useEffect, useMemo, useState } from "react";
import { isCurrencySupported, listSupportedCurrencies, listTokens } from "../currencies";
import { loadCurrenciesByProvider } from "./helper";

// FIXME(LIVE-10505): bad performane & shared utility to move to coin-framework
const listSupportedTokens = () => listTokens().filter(t => isCurrencySupported(t.parentCurrency));

const initialResult: GroupedCurrencies = {
  sortedCryptoCurrencies: [],
  currenciesByProvider: [],
};

export const useGroupedCurrenciesByProvider = () => {
  const [result, setResult] = useState(initialResult);

  const coinsAndTokensSupported = useMemo(
    () => (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
    [],
  );

  // Get mapped assets filtered by supported & sorted currencies, grouped by provider id
  useEffect(() => {
    loadCurrenciesByProvider(coinsAndTokensSupported).then(setResult);
  }, [coinsAndTokensSupported]);

  return result;
};
