import { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useAcceptedCurrency } from "@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency";

export function useAssetSelection(sortedCryptoCurrencies: CryptoOrTokenCurrency[]) {
  const isAcceptedCurrency = useAcceptedCurrency();

  const assetsToDisplay = useMemo(
    () => sortedCryptoCurrencies.filter(isAcceptedCurrency),
    [sortedCryptoCurrencies, isAcceptedCurrency],
  );

  return {
    assetsToDisplay,
  };
}
