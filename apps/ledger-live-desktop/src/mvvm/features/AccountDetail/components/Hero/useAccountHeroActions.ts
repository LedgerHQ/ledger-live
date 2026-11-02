import { useCallback } from "react";
import type { Account } from "@ledgerhq/types-live";
import type { AccountHeroActionId } from "@features/flow-account-detail-hero";
import { track } from "@shared/analytics";
import { useDispatch } from "LLD/hooks/redux";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { openModal } from "~/renderer/actions/modals";
import { ACCOUNT_DETAIL_TRACKING_PAGE_NAME } from "../../constants";
import type { AccountAsset, AccountAssetsByAction } from "./types";
import { useInvestActions } from "./useInvestActions";
import type { PickAccountAsset } from "./usePickAccountAsset";

export function useAccountHeroActions(
  account: Account,
  assets: readonly AccountAsset[],
  byAction: AccountAssetsByAction,
  pickAsset: PickAccountAsset,
): (id: AccountHeroActionId) => void {
  const dispatch = useDispatch();
  const openSendFlow = useOpenSendFlow();
  const onInvest = useInvestActions({ account, byAction, pickAsset });

  const openSend = useCallback(
    ({ account: assetAccount, parentAccount }: AccountAsset) =>
      openSendFlow({
        account: assetAccount,
        parentAccount,
        source: ACCOUNT_DETAIL_TRACKING_PAGE_NAME,
      }),
    [openSendFlow],
  );

  return useCallback(
    (id: AccountHeroActionId) => {
      track("button_clicked", {
        button: id,
        currency: account.currency.id,
        page: ACCOUNT_DETAIL_TRACKING_PAGE_NAME,
      });
      switch (id) {
        case "receive":
          dispatch(
            openModal("MODAL_RECEIVE", { account, sourcePage: ACCOUNT_DETAIL_TRACKING_PAGE_NAME }),
          );
          return;
        case "send":
          pickAsset(assets, openSend);
          return;
        case "buy":
        case "sell":
        case "earn":
          onInvest(id);
          return;
        default:
          return;
      }
    },
    [account, assets, dispatch, onInvest, openSend, pickAsset],
  );
}
