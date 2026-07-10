import { useCallback, useMemo } from "react";
import { useTradeAvailability } from "@ledgerhq/asset-detail";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { track } from "~/analytics";
import { useOpenBuySell } from "LLM/features/Buy";
import { useOpenSwap } from "LLM/features/Swap";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";

export type SecondaryButtonType = "swap" | null;

export type AssetActionsAvailability = Readonly<{
  isCurrencySupported: boolean;
  isBuyAvailable: boolean;
  availableOnSwap: boolean;
  hasAssetAccounts: boolean;
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
  const accounts = useSelector(flattenAccountsSelector);
  const { availableOnBuy, availableOnSwap, isCurrencySupported } = useTradeAvailability(ledgerIds);

  return useMemo(() => {
    if (!currency || !isCurrencySupported) {
      return {
        isCurrencySupported: false,
        isBuyAvailable: false,
        availableOnSwap: false,
        hasAssetAccounts: false,
        secondaryButton: null,
      };
    }

    const assetCurrencyIds = new Set([currency.id, ...(ledgerIds ?? [])]);
    const hasAssetAccounts = accounts.some(a => assetCurrencyIds.has(getAccountCurrency(a).id));
    const secondaryButton: SecondaryButtonType = availableOnSwap ? "swap" : null;

    return {
      isCurrencySupported,
      isBuyAvailable: availableOnBuy,
      availableOnSwap,
      hasAssetAccounts,
      secondaryButton,
    };
  }, [currency, ledgerIds, isCurrencySupported, availableOnBuy, availableOnSwap, accounts]);
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

  return {
    isBuyAvailable,
    secondaryButton,
    onBuyPress,
    onSwapPress,
  };
}
