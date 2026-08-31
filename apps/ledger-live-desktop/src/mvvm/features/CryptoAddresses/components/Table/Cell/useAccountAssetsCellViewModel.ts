import { useMemo } from "react";
import type { CryptoIconSize } from "LLD/components/SquaredCryptoIcon";
import type { CryptoIconStackItem } from "LLD/components/CryptoIconStack";
import type { AccountAssetCurrency } from "LLD/features/CryptoAddresses/utils/getAccountAssetsCurrencies";
import { getValidCryptoIconSize } from "~/renderer/utils/cryptoIconSize";

const ICON_SIZE: CryptoIconSize = getValidCryptoIconSize(24);

export function useAccountAssetsCellViewModel(currencies: readonly AccountAssetCurrency[]) {
  const items = useMemo<readonly CryptoIconStackItem[]>(
    () => currencies.map(currency => ({ ledgerId: currency.id, ticker: currency.ticker })),
    [currencies],
  );

  return {
    isEmpty: items.length === 0,
    iconSize: ICON_SIZE,
    items,
  };
}
