import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { getLocalNodeCurrencies } from "@ledgerhq/live-common/localNode/index";

export function useLocalNodeAccountBannerViewModel(currency: CryptoCurrency) {
  return {
    isVisible: getLocalNodeCurrencies().includes(currency.id),
    currencyName: currency.name,
  };
}
