import { useMemo, useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export function useAssets(
  currencies: CryptoOrTokenCurrency[],
  sortedCryptoCurrencies: CryptoOrTokenCurrency[],
) {
  const currencyIdsArray = useMemo(() => currencies.map(currency => currency.id), [currencies]);
  const currencyIdsSet = useMemo(() => new Set(currencyIdsArray), [currencyIdsArray]);

  const filteredSortedCryptoCurrencies = useMemo(() => {
    if (currencyIdsSet.size === 0) return sortedCryptoCurrencies;
    return sortedCryptoCurrencies.filter(currency => currencyIdsSet.has(currency.id));
  }, [sortedCryptoCurrencies, currencyIdsSet]);

  const [availableAssets, setAvailableAssets] = useState<CryptoOrTokenCurrency[] | null>(null);

  return {
    availableAssets: availableAssets ?? filteredSortedCryptoCurrencies,
    setAvailableAssets,
    filteredSortedCryptoCurrencies,
    currencyIdsArray,
    currencyIdsSet,
  };
}
