import { useCallback } from "react";
import type { Account } from "@ledgerhq/types-live";
import type { AccountHeroActionId } from "@features/flow-account-detail-hero";
import {
  ACCOUNT_DETAIL_EVENTS,
  ACCOUNT_DETAIL_PAGES,
  quickActionClickedProps,
} from "@features/flow-account-detail";
import { track } from "@shared/analytics";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { useOpenReceiveFlow } from "LLD/features/Receive/hooks/useOpenReceiveFlow";
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
  const { openReceiveFlow } = useOpenReceiveFlow();
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
          openReceiveFlow({ account, source: ACCOUNT_DETAIL_PAGES.account });
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
    [account, assets, openReceiveFlow, onInvest, openSend, pickAsset],
  );
}
