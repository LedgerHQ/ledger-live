import { useCallback } from "react";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { track } from "~/analytics";
import { useOpenBuySell } from "LLM/features/Buy";

export function useIsBuyAvailable(currency: CryptoCurrency | undefined): boolean {
  const { isCurrencyAvailable } = useRampCatalog();
  return !!currency && isCurrencyAvailable(currency.id, "onRamp");
}

export function useFooterViewModel(currency: CryptoCurrency | undefined) {
  const { handleOpenBuySell } = useOpenBuySell({
    currency,
    sourceScreenName: "Asset Detail",
  });

  const isBuyAvailable = useIsBuyAvailable(currency);

  const onBuyPress = useCallback(() => {
    if (!currency) return;
    track("button_clicked", {
      button: "buy",
      currency: currency.id,
      page: "Asset Detail",
    });
    handleOpenBuySell("buy");
  }, [currency, handleOpenBuySell]);

  return {
    isBuyAvailable,
    onBuyPress,
  };
}
