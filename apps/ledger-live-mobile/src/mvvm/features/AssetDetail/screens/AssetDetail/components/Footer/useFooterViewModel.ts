import { useCallback, useMemo, useState } from "react";
import { useTradeAvailability } from "@ledgerhq/asset-detail";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { track } from "~/analytics";
import { useOpenBuySell } from "LLM/features/Buy";
import { useOpenSwap } from "LLM/features/Swap";
import { useOpenStakeDrawer } from "LLM/features/Stake";
import { useStake } from "LLM/hooks/useStake/useStake";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { shouldShowMoreButton } from "./utils";

export type SecondaryButtonType = "swap" | null;

export type AssetActionsAvailability = Readonly<{
  isCurrencySupported: boolean;
  isBuyAvailable: boolean;
  isSellAvailable: boolean;
  isEarnAvailable: boolean;
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
  const { availableOnBuy, availableOnSell, availableOnSwap, isCurrencySupported } =
    useTradeAvailability(ledgerIds);
  const { getCanStakeCurrency } = useStake();
  const canStake = currency ? getCanStakeCurrency(currency.id) : false;

  return useMemo(() => {
    if (!currency || !isCurrencySupported) {
      return {
        isCurrencySupported: false,
        isBuyAvailable: false,
        isSellAvailable: false,
        isEarnAvailable: false,
        availableOnSwap: false,
        hasAssetAccounts: false,
        secondaryButton: null,
      };
    }

    const assetCurrencyIds = new Set([currency.id, ...(ledgerIds ?? [])]);
    const hasAssetAccounts = accounts.some(a => assetCurrencyIds.has(getAccountCurrency(a).id));
    const assetHasFunds = accounts.some(
      a => assetCurrencyIds.has(getAccountCurrency(a).id) && a.balance.gt(0),
    );
    const secondaryButton: SecondaryButtonType = availableOnSwap ? "swap" : null;

    return {
      isCurrencySupported,
      isBuyAvailable: availableOnBuy,
      isSellAvailable: availableOnSell && assetHasFunds,
      isEarnAvailable: canStake,
      availableOnSwap,
      hasAssetAccounts,
      secondaryButton,
    };
  }, [
    currency,
    ledgerIds,
    isCurrencySupported,
    availableOnBuy,
    availableOnSell,
    canStake,
    availableOnSwap,
    accounts,
  ]);
}

export function useFooterViewModel(currency: AssetDetailCurrencyProps, ledgerIds?: string[]) {
  const [isMoreOptionsRequestingToBeOpened, setIsMoreOptionsRequestingToBeOpened] = useState(false);

  const { handleOpenBuySell } = useOpenBuySell({
    currency,
    sourceScreenName: "Asset Detail",
  });

  const { handleOpenSwap } = useOpenSwap({
    currency,
    sourceScreenName: "Asset Detail",
    ledgerIds,
  });

  const { handleOpenStakeDrawer } = useOpenStakeDrawer({
    sourceScreenName: "Asset Detail",
    currencies: ledgerIds,
  });

  const { isBuyAvailable, isSellAvailable, isEarnAvailable, secondaryButton } =
    useAssetActionsAvailability(currency, ledgerIds);

  const isMoreButtonVisible = shouldShowMoreButton(isSellAvailable, isEarnAvailable);

  const onBuyPress = useCallback(() => {
    if (!currency) return;
    track("button_clicked", {
      button: "buy",
      currency: currency.id,
      page: "Asset Detail",
    });
    handleOpenBuySell("buy");
  }, [currency, handleOpenBuySell]);

  const onSellPress = useCallback(() => {
    if (!currency) return;
    track("button_clicked", {
      button: "sell",
      currency: currency.id,
      page: "Asset Detail",
    });
    handleOpenBuySell("sell");
  }, [currency, handleOpenBuySell]);

  const onEarnPress = useCallback(() => {
    if (!currency) return;
    track("button_clicked", {
      button: "earn",
      currency: currency.id,
      page: "Asset Detail",
    });
    handleOpenStakeDrawer();
  }, [currency, handleOpenStakeDrawer]);

  const onSwapPress = useCallback(() => {
    if (!currency) return;
    track("button_clicked", {
      button: "swap",
      currency: currency.id,
      page: "Asset Detail",
    });
    handleOpenSwap();
  }, [currency, handleOpenSwap]);

  const onMorePress = useCallback(() => {
    if (!currency) return;
    track("button_clicked", {
      button: "more",
      currency: currency.id,
      page: "Asset Detail",
    });
    setIsMoreOptionsRequestingToBeOpened(true);
  }, [currency, setIsMoreOptionsRequestingToBeOpened]);

  const onMoreOptionsClose = useCallback(() => {
    setIsMoreOptionsRequestingToBeOpened(false);
  }, [setIsMoreOptionsRequestingToBeOpened]);

  return {
    isBuyAvailable,
    isSellAvailable,
    isEarnAvailable,
    isMoreButtonVisible,
    secondaryButton,
    onBuyPress,
    onSellPress,
    onEarnPress,
    onSwapPress,
    onMorePress,
    isMoreOptionsRequestingToBeOpened,
    onMoreOptionsClose,
  };
}
