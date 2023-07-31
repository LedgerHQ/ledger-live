import { CurrenciesByProviderId, MappedAsset } from "./type";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  isCurrencySupported,
  listSupportedCurrencies,
  listTokens,
  currenciesByMarketcap,
} from "../currencies";
import { getMappedAssets } from "./api";

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
    const assetsByLedgerId: Record<string, MappedAsset> = {};
    for (const asset of assets) {
      assetsByLedgerId[asset.ledgerId] = asset;
    }
    const assetsByProviderId: Record<string, CurrenciesByProviderId> = {};
    for (const ledgerCurrency of sortedCurrenciesSupported) {
      const asset = assetsByLedgerId[ledgerCurrency.id];
      if (asset) {
        if (!assetsByProviderId[asset.providerId]) {
          assetsByProviderId[asset.providerId] = {
            providerId: asset.providerId,
            currenciesByNetwork: [],
          };
        }
        assetsByProviderId[asset.providerId].currenciesByNetwork.push(ledgerCurrency);
      }
    }
    const currenciesByProvider = Object.values(assetsByProviderId);
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
