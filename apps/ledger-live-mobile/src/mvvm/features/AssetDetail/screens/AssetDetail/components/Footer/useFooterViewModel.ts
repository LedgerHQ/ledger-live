import { useCallback } from "react";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { track } from "~/analytics";
import { useOpenBuySell } from "LLM/features/Buy";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";

export function useIsBuyAvailable(currency: AssetDetailCurrencyProps): boolean {
  const { isCurrencyAvailable } = useRampCatalog();

  return !!currency && isCurrencyAvailable(currency.id, "onRamp");
}

export function useFooterViewModel(currency: AssetDetailCurrencyProps) {
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
