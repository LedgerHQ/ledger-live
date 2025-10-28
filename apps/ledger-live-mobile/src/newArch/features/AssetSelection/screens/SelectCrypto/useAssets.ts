import { useMemo, useState, useEffect } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  buildProviderCoverageMap,
  extractProviderCurrencies,
  filterProvidersByIds,
} from "@ledgerhq/live-common/modularDrawer/utils/currencyUtils";
import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";

// TODO: Remove if we use DADA for this feature

export function useAssets(
  currencies: CryptoOrTokenCurrency[],
  currenciesByProvider: CurrenciesByProviderId[],
  sortedCryptoCurrencies: CryptoOrTokenCurrency[],
) {
  const currencyIdsArray = useMemo(() => currencies.map(currency => currency.id), [currencies]);
  const currencyIdsSet = useMemo(() => new Set(currencyIdsArray), [currencyIdsArray]);

  const filteredSortedCryptoCurrencies = useMemo(() => {
    if (currencyIdsSet.size === 0) return sortedCryptoCurrencies;
    return sortedCryptoCurrencies.filter(currency => currencyIdsSet.has(currency.id));
  }, [sortedCryptoCurrencies, currencyIdsSet]);

  const [availableAssets, setAvailableAssets] = useState<CryptoOrTokenCurrency[] | null>(null);

  const computedAssets: CryptoOrTokenCurrency[] = useMemo((): CryptoOrTokenCurrency[] => {
    if (currencyIdsSet.size === 0) {
      return filteredSortedCryptoCurrencies;
    }

    const providerCoverageMap = buildProviderCoverageMap(currenciesByProvider);
    const filtered = filterProvidersByIds(
      currenciesByProvider,
      currencyIdsSet,
      providerCoverageMap,
    );

    const result = extractProviderCurrencies(filtered) as unknown as CryptoOrTokenCurrency[];
    return result;
  }, [currenciesByProvider, currencyIdsSet, filteredSortedCryptoCurrencies]);

  useEffect(() => {
    setAvailableAssets(computedAssets);
  }, [computedAssets]);

  return {
    availableAssets: availableAssets ?? filteredSortedCryptoCurrencies,
    setAvailableAssets,
    filteredSortedCryptoCurrencies,
    currencyIdsArray,
    currencyIdsSet,
  };
}
