import { useMemo, useState, useEffect } from "react";
import { getCurrenciesIds } from "../utils/getCurrenciesIds";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export function useAssetSelection(
  currencies: CryptoOrTokenCurrency[],
  sortedCryptoCurrencies: CryptoOrTokenCurrency[],
) {
  const currenciesIdsArray = useMemo(() => getCurrenciesIds(currencies), [currencies]);
  const filteredSortedCryptoCurrencies = useMemo(
    () => sortedCryptoCurrencies.filter(currency => currenciesIdsArray.includes(currency.id)),
    [sortedCryptoCurrencies, currenciesIdsArray],
  );
  const [assetsToDisplay, setAssetsToDisplay] = useState<CryptoOrTokenCurrency[]>(
    filteredSortedCryptoCurrencies,
  );
  useEffect(() => {
    setAssetsToDisplay(filteredSortedCryptoCurrencies);
  }, [filteredSortedCryptoCurrencies]);
  return {
    assetsToDisplay,
    setAssetsToDisplay,
    filteredSortedCryptoCurrencies,
    currenciesIdsArray,
  };
}
