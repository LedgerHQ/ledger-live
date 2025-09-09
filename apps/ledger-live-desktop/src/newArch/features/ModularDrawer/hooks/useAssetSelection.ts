import { useMemo, useState } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export function useAssetSelection(
  currencyIds: string[],
  sortedCryptoCurrencies: CryptoOrTokenCurrency[],
) {
  const currencyIdsSet = useMemo(() => new Set(currencyIds), [currencyIds]);

  const filteredSortedCryptoCurrencies = useMemo(() => {
    if (currencyIdsSet.size === 0) return sortedCryptoCurrencies;
    return sortedCryptoCurrencies.filter(currency => currencyIdsSet.has(currency.id));
  }, [sortedCryptoCurrencies, currencyIdsSet]);

  const [assetsToDisplay, setAssetsToDisplay] = useState<CryptoOrTokenCurrency[] | null>(null);

  return {
    assetsToDisplay: assetsToDisplay ?? filteredSortedCryptoCurrencies,
    setAssetsToDisplay,
    currencyIdsSet,
  };
}
