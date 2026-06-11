import { useMemo } from "react";
import type { CryptoIconSize } from "LLD/components/SquaredCryptoIcon";
import type { AccountAssetCurrency } from "LLD/features/CryptoAddresses/utils/getAccountAssetsCurrencies";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";

const ICON_SIZE: CryptoIconSize = getValidCryptoIconSize(24);

export function useAccountAssetsCellViewModel(currencies: readonly AccountAssetCurrency[]) {
  const isEmpty = currencies.length === 0;

  const tooltipContent = useMemo(
    () => currencies.map(currency => currency.ticker).join(", "),
    [currencies],
  );

  return {
    isEmpty,
    iconSize: ICON_SIZE,
    items: currencies,
    tooltipContent,
  };
}
