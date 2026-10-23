import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { AssetActionId } from "@features/platform-quick-actions";
import { setTrackingSource } from "@shared/analytics";
import { buildBuyNavigationState } from "LLD/features/Market/utils/buyNavigation";
import { buildSellNavigationState } from "LLD/features/Market/utils/sellNavigation";
import { useNavigateToStakeForAccount } from "LLD/hooks/useNavigateToStakeForAccount";
import { ACCOUNT_DETAIL_TRACKING_PAGE_NAME } from "../../constants";
import type { AccountAsset, AccountAssetsByAction } from "./types";
import { useOpenNetworkAssetPicker } from "./useOpenNetworkAssetPicker";
import type { PickAccountAsset } from "./usePickAccountAsset";

type HeroInvestActionId = Exclude<AssetActionId, "swap">;

type Params = Readonly<{
  account: Account;
  byAction: AccountAssetsByAction;
  pickAsset: PickAccountAsset;
}>;

export function useInvestActions({
  account,
  byAction,
  pickAsset,
}: Params): (id: HeroInvestActionId) => void {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const openNetworkAssetPicker = useOpenNetworkAssetPicker();
  const { navigateToStakeForAccount } = useNavigateToStakeForAccount();

  const openBuy = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      navigate("/exchange", {
        state: buildBuyNavigationState({ ledgerCurrency: currency, account, returnTo: pathname }),
      });
    },
    [account, navigate, pathname],
  );

  const openSell = useCallback(
    ({ currency, account: assetAccount, parentAccount }: AccountAsset) => {
      navigate("/exchange", {
        state: buildSellNavigationState({
          ledgerCurrency: currency,
          account: assetAccount,
          parentAccount,
          returnTo: pathname,
        }),
      });
    },
    [navigate, pathname],
  );

  const openEarn = useCallback(
    ({ account: assetAccount, parentAccount }: AccountAsset) => {
      navigateToStakeForAccount(assetAccount, parentAccount, {
        source: ACCOUNT_DETAIL_TRACKING_PAGE_NAME,
        returnTo: pathname,
      });
    },
    [navigateToStakeForAccount, pathname],
  );

  return useCallback(
    (id: HeroInvestActionId) => {
      setTrackingSource(ACCOUNT_DETAIL_TRACKING_PAGE_NAME);
      if (id === "sell") {
        pickAsset(byAction.sell, openSell);
        return;
      }
      if (id === "earn") {
        pickAsset(byAction.earn, openEarn);
        return;
      }
      openNetworkAssetPicker(account.currency.id, id, openBuy);
    },
    [account, byAction, openBuy, openEarn, openNetworkAssetPicker, openSell, pickAsset],
  );
}
