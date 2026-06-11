import { useCallback, useMemo } from "react";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useAcceptedCurrency } from "@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency";
import { useSelector } from "~/context/hooks";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { track } from "~/analytics";
import { useOpenBuySell } from "LLM/features/Buy";
import { useOpenSwap } from "LLM/features/Swap";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";

export type SecondaryButtonType = "swap" | "receive" | null;

export function useIsBuyAvailable(currency: AssetDetailCurrencyProps): boolean {
  const { isCurrencyAvailable } = useRampCatalog();

  return !!currency && isCurrencyAvailable(currency.id, "onRamp");
}

export function useSecondaryButtonType(currency: AssetDetailCurrencyProps): SecondaryButtonType {
  const accounts = useSelector(shallowAccountsSelector);
  const isAcceptedCurrency = useAcceptedCurrency();

  return useMemo(() => {
    if (!currency) return null;

    const walletHasFunds = accounts.some(a => a.balance.gt(0));

    if (walletHasFunds) {
      return isAcceptedCurrency(currency) ? "swap" : null;
    }

    return "receive";
  }, [accounts, currency, isAcceptedCurrency]);
}

export function useFooterViewModel(currency: AssetDetailCurrencyProps, ledgerIds?: string[]) {
  const { handleOpenBuySell } = useOpenBuySell({
    currency,
    sourceScreenName: "Asset Detail",
  });

  const { handleOpenSwap } = useOpenSwap({
    currency,
    sourceScreenName: "Asset Detail",
  });

  const { handleOpenReceiveDrawer } = useOpenReceiveDrawer({
    currency,
    currencyIds: ledgerIds,
    sourceScreenName: "Asset Detail",
  });

  const isBuyAvailable = useIsBuyAvailable(currency);
  const secondaryButton = useSecondaryButtonType(currency);

  const onBuyPress = useCallback(() => {
    if (!currency) return;
    track("button_clicked", {
      button: "buy",
      currency: currency.id,
      page: "Asset Detail",
    });
    handleOpenBuySell("buy");
  }, [currency, handleOpenBuySell]);

  const onSwapPress = useCallback(() => {
    if (!currency) return;
    track("button_clicked", {
      button: "swap",
      currency: currency.id,
      page: "Asset Detail",
    });
    handleOpenSwap();
  }, [currency, handleOpenSwap]);

  const onReceivePress = useCallback(() => {
    if (!currency) return;
    track("button_clicked", {
      button: "receive",
      currency: currency.id,
      page: "Asset Detail",
    });
    handleOpenReceiveDrawer();
  }, [currency, handleOpenReceiveDrawer]);

  return {
    isBuyAvailable,
    secondaryButton,
    onBuyPress,
    onSwapPress,
    onReceivePress,
  };
}
