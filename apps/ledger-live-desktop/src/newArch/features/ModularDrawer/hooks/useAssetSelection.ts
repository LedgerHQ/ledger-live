import { useMemo } from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCurrenciesUnderFeatureFlag } from "@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag";

export function useAssetSelection(
  currencyIds: string[],
  sortedCryptoCurrencies: CryptoOrTokenCurrency[],
) {
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();

  const assetsToDisplay = useMemo(() => {
    return sortedCryptoCurrencies.filter(
      c =>
        (c.type === "CryptoCurrency" && !deactivatedCurrencyIds.has(c.id)) ||
        (c.type === "TokenCurrency" && !deactivatedCurrencyIds.has(c.parentCurrency.id)),
    );
  }, [sortedCryptoCurrencies, deactivatedCurrencyIds]);

  const currencyIdsSet = useMemo(() => new Set(currencyIds), [currencyIds]);

  return {
    assetsToDisplay,
    currencyIdsSet,
  };
}
