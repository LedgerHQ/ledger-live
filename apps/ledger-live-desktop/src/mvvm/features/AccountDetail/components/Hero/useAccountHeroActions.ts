import { useCallback } from "react";
import type { Account } from "@ledgerhq/types-live";
import type { AccountHeroActionId } from "@features/flow-account-detail-hero";
import {
  ACCOUNT_DETAIL_EVENTS,
  ACCOUNT_DETAIL_PAGES,
  quickActionClickedProps,
} from "@features/flow-account-detail";
import { track } from "@shared/analytics";
import { useDispatch } from "LLD/hooks/redux";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { openModal } from "~/renderer/actions/modals";
import { getAccountTrackingFacts } from "../../utils/accountTracking";
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
        source: ACCOUNT_DETAIL_PAGES.account,
      }),
    [openSendFlow],
  );

  return useCallback(
    (id: AccountHeroActionId) => {
      track(
        ACCOUNT_DETAIL_EVENTS.buttonClicked,
        quickActionClickedProps(getAccountTrackingFacts(account), id),
      );
      switch (id) {
        case "receive":
          dispatch(
            openModal("MODAL_RECEIVE", { account, sourcePage: ACCOUNT_DETAIL_PAGES.account }),
          );
          return;
        case "send":
          pickAsset(assets, openSend, id);
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
