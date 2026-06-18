import { useCallback, useMemo } from "react";
import { useTradeAvailability } from "@ledgerhq/asset-detail";
import { useSelector } from "~/context/hooks";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { track } from "~/analytics";
import { useOpenBuySell } from "LLM/features/Buy";
import { useOpenSwap } from "LLM/features/Swap";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";

export type SecondaryButtonType = "swap" | "receive" | null;

export type AssetActionsAvailability = Readonly<{
  isCurrencySupported: boolean;
  isBuyAvailable: boolean;
  availableOnSwap: boolean;
  secondaryButton: SecondaryButtonType;
}>;

/**
 * Resolves which footer actions an asset exposes, sharing the gating logic with
 * desktop via `useTradeAvailability`. A currency that is not supported (unknown
 * to the build or deactivated by a feature flag) exposes no actions at all.
 */
export function useAssetActionsAvailability(
  currency: AssetDetailCurrencyProps,
  ledgerIds?: string[],
): AssetActionsAvailability {
  const accounts = useSelector(shallowAccountsSelector);
  const { availableOnBuy, availableOnSwap, isCurrencySupported } = useTradeAvailability(ledgerIds);

  return useMemo(() => {
    if (!currency || !isCurrencySupported) {
      return {
        isCurrencySupported: false,
        isBuyAvailable: false,
        availableOnSwap: false,
        secondaryButton: null,
      };
    }

    const walletHasFunds = accounts.some(a => a.balance.gt(0));
    const secondaryButton: SecondaryButtonType =
      walletHasFunds && availableOnSwap ? "swap" : "receive";

    return {
      isCurrencySupported,
      isBuyAvailable: availableOnBuy,
      availableOnSwap,
      secondaryButton,
    };
  }, [currency, isCurrencySupported, availableOnBuy, availableOnSwap, accounts]);
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

  const { isBuyAvailable, secondaryButton } = useAssetActionsAvailability(currency, ledgerIds);

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
