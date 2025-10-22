import { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useAcceptedCurrency } from "@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency";

export function useAssetSelection(
  currencyIds: string[],
  sortedCryptoCurrencies: CryptoOrTokenCurrency[],
) {
  const isAcceptedCurrency = useAcceptedCurrency();

  const assetsToDisplay = useMemo(
    () => sortedCryptoCurrencies.filter(isAcceptedCurrency),
    [sortedCryptoCurrencies, isAcceptedCurrency],
  );

  const currencyIdsSet = useMemo(() => new Set(currencyIds), [currencyIds]);

  return {
    assetsToDisplay,
    currencyIdsSet,
  };
}
