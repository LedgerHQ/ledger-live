import { useMemo, useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export function useAssets(
  currencies: CryptoOrTokenCurrency[],
  sortedCryptoCurrencies: CryptoOrTokenCurrency[],
) {
  const currenciesIdsArray = useMemo(() => currencies.map(currency => currency.id), [currencies]);
  const currencyIdsSet = useMemo(() => new Set(currenciesIdsArray), [currenciesIdsArray]);

  const filteredSortedCryptoCurrencies = useMemo(() => {
    if (currencyIdsSet.size === 0) return sortedCryptoCurrencies;
    return sortedCryptoCurrencies.filter(currency => currencyIdsSet.has(currency.id));
  }, [sortedCryptoCurrencies, currencyIdsSet]);

  const [assetsToDisplay, setAssetsToDisplay] = useState<CryptoOrTokenCurrency[] | null>(null);

  return {
    assetsToDisplay: assetsToDisplay ?? filteredSortedCryptoCurrencies,
    setAssetsToDisplay,
    filteredSortedCryptoCurrencies,
    currenciesIdsArray,
    currencyIdsSet,
  };
}
