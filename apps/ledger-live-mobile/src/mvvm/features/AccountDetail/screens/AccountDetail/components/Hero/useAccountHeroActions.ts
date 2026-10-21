import { useCallback } from "react";
import type { Account } from "@ledgerhq/types-live";
import { track } from "@shared/analytics";
import { canReceive } from "@ledgerhq/live-common/account/index";
import type { AccountHeroActionId } from "@features/flow-account-detail-hero";
import { useTransferDrawerController } from "LLM/features/QuickActions";
import { useOpenReceiveDrawer } from "LLM/features/Receive";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";
import type { AccountAsset, AccountAssetsByAction } from "LLM/utils/accountAssets";
import { ACCOUNT_DETAIL_PAGE } from "./constants";
import { useInvestActions, type PickAsset } from "./useInvestActions";

export function useAccountHeroActions(
  account: Account,
  assets: readonly AccountAsset[],
  byAction: AccountAssetsByAction,
  pickAsset: PickAsset,
): (id: AccountHeroActionId) => void {
  const { openDrawer: openTransferDrawer } = useTransferDrawerController();
  const { openReceiveForAccount } = useOpenReceiveDrawer({
    currency: account.currency,
    sourceScreenName: ACCOUNT_DETAIL_PAGE,
  });
  const { openSendFlowForAccount } = useOpenSendFlow({
    currency: account.currency,
    sourceScreenName: ACCOUNT_DETAIL_PAGE,
  });
  const onInvest = useInvestActions(account, assets, byAction, pickAsset);

  return useCallback(
    (id: AccountHeroActionId) => {
      track("button_clicked", {
        button: id,
        currency: account.currency.id,
        page: ACCOUNT_DETAIL_PAGE,
      });
      switch (id) {
        case "transfer":
          openTransferDrawer({
            sourceScreenName: ACCOUNT_DETAIL_PAGE,
            scope: { type: "account", accountId: account.id },
          });
          return;
        case "receive":
          if (canReceive(account, undefined)) openReceiveForAccount(account);
          return;
        case "send":
          openSendFlowForAccount(account);
          return;
        default:
          onInvest(id);
      }
    },
    [account, onInvest, openReceiveForAccount, openSendFlowForAccount, openTransferDrawer],
  );
}
