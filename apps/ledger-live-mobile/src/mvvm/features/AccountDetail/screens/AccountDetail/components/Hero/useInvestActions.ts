import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import { makeEmptyTokenAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useOpenBuySell } from "LLM/features/Buy";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { useOpenStakeDrawer } from "LLM/features/Stake";
import { useOpenSwap } from "LLM/features/Swap";
import { useSelector } from "~/context/hooks";
import { modularDrawerSourceSelector } from "~/reducers/modularDrawer";
import type { useAccountAssetPicker } from "LLM/components/AccountAssetPickerSheet/useAccountAssetPicker";
import type { AssetActionId } from "@features/platform-quick-actions";
import type { AccountAsset, AccountAssetsByAction } from "LLM/utils/accountAssets";
import {
  ACCOUNT_DETAIL_PAGE,
  ACCOUNT_SCOPED_ASSETS_CONFIGURATION,
  ACCOUNT_SCOPED_NETWORKS_CONFIGURATION,
} from "./constants";

export type PickAsset = ReturnType<typeof useAccountAssetPicker>["pickAsset"];

type NetworkAssetAction = "buy" | "swap";
type HeldAssetAction = "sell" | "earn";

const isHeldAssetAction = (id: AssetActionId): id is HeldAssetAction =>
  id === "sell" || id === "earn";

function useClosePendingAccountCurrencyDrawerOnBlur(drawer: {
  isOpen: boolean;
  completionMode: ReturnType<typeof useModularDrawerController>["completionMode"];
  closeDrawer: () => void;
}) {
  const source = useSelector(modularDrawerSourceSelector);
  const pendingDrawer = useRef({ ...drawer, source });

  useEffect(() => {
    pendingDrawer.current = { ...drawer, source };
  });

  useFocusEffect(
    useCallback(() => {
      return () => {
        const drawer = pendingDrawer.current;
        if (
          drawer.isOpen &&
          drawer.completionMode === "currency" &&
          drawer.source === ACCOUNT_DETAIL_PAGE
        ) {
          drawer.closeDrawer();
        }
      };
    }, []),
  );
}

export function useInvestActions(
  account: Account,
  assets: readonly AccountAsset[],
  byAction: AccountAssetsByAction,
  pickAsset: PickAsset,
): (id: AssetActionId) => void {
  const { openDrawer, isOpen, completionMode, closeDrawer } = useModularDrawerController();
  useClosePendingAccountCurrencyDrawerOnBlur({ isOpen, completionMode, closeDrawer });
  const { openSwapForAccount } = useOpenSwap({
    currency: account.currency,
    sourceScreenName: ACCOUNT_DETAIL_PAGE,
  });
  const { openBuySellForAccount, openBuySellForCurrency } = useOpenBuySell({
    currency: account.currency,
    sourceScreenName: ACCOUNT_DETAIL_PAGE,
    returnToPreviousScreenOnClose: true,
  });
  const { openStakeForAccount } = useOpenStakeDrawer({
    sourceScreenName: ACCOUNT_DETAIL_PAGE,
    currencies: [account.currency.id],
  });

  const openForNetworkAsset = useCallback(
    (id: NetworkAssetAction, currency: CryptoOrTokenCurrency) => {
      const held = assets.find(asset => asset.currency.id === currency.id);
      if (id === "swap") {
        if (held) openSwapForAccount(held.account, held.parentAccount);
        else if (currency.type === "TokenCurrency")
          openSwapForAccount(makeEmptyTokenAccount(account, currency), account);
        return;
      }
      if (held) openBuySellForAccount("buy", held.account, held.parentAccount);
      else openBuySellForCurrency("buy", currency);
    },
    [account, assets, openBuySellForAccount, openBuySellForCurrency, openSwapForAccount],
  );

  const openForHeldAsset = useCallback(
    (id: HeldAssetAction, { account: assetAccount, parentAccount }: AccountAsset) => {
      if (id === "sell") openBuySellForAccount("sell", assetAccount, parentAccount);
      else void openStakeForAccount(assetAccount, parentAccount);
    },
    [openBuySellForAccount, openStakeForAccount],
  );

  return useCallback(
    (id: AssetActionId) => {
      if (isHeldAssetAction(id)) {
        pickAsset(byAction[id], asset => openForHeldAsset(id, asset));
        return;
      }
      openDrawer({
        flow: id,
        useCase: id,
        source: ACCOUNT_DETAIL_PAGE,
        currencies: [account.currency.id],
        areCurrenciesFiltered: true,
        completionMode: "currency",
        assetsConfiguration: ACCOUNT_SCOPED_ASSETS_CONFIGURATION,
        networksConfiguration: ACCOUNT_SCOPED_NETWORKS_CONFIGURATION,
        onCurrencySelected: currency => {
          if (currency) openForNetworkAsset(id, currency);
        },
      });
    },
    [account, byAction, openDrawer, openForHeldAsset, openForNetworkAsset, pickAsset],
  );
}
