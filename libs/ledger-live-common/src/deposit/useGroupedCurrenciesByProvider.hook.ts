import { CurrenciesByProviderId } from "./type";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  isCurrencySupported,
  listSupportedCurrencies,
  listTokens,
  currenciesByMarketcap,
} from "../currencies";
import { getMappedAssets } from "./api";
import { groupCurrenciesByProvider } from "./helper";

const listSupportedTokens = () => listTokens().filter(t => isCurrencySupported(t.parentCurrency));

export const useGroupedCurrenciesByProvider = () => {
  const [currencies, setCurrencies] = useState<CryptoOrTokenCurrency[]>([]);
  const [currenciesByProvider, setCurrenciesByProvider] = useState<CurrenciesByProviderId[]>([]);

  // Get Supported Currencies and sort them by marketcap
  const coinsAndTokensSupported = useMemo(
    () => (listSupportedCurrencies() as CryptoOrTokenCurrency[]).concat(listSupportedTokens()),
    [],
  );

  // Get mapped assets filtered by supported currencies and grouped by provider id
  const getCurrenciesAndGroupThemByProvider = useCallback(async () => {
    const [sortedCurrenciesSupported, assets] = await Promise.all([
      currenciesByMarketcap(coinsAndTokensSupported),
      getMappedAssets(),
    ]);
    const currenciesByProvider = groupCurrenciesByProvider(assets, sortedCurrenciesSupported);
    setCurrenciesByProvider(currenciesByProvider);
    setCurrencies(
      currenciesByProvider
        .filter(value => value.currenciesByNetwork && value.currenciesByNetwork.length > 0)
        .map(value => value.currenciesByNetwork[0]),
    );
  }, [coinsAndTokensSupported]);

  useEffect(() => {
    getCurrenciesAndGroupThemByProvider();
  }, [getCurrenciesAndGroupThemByProvider]);

  return {
    currenciesByProvider,
    sortedCryptoCurrencies: currencies,
  };
};
