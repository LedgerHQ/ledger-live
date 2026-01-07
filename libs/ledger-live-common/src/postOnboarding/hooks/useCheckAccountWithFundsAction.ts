import { useSelector } from "react-redux";
import { Account, PostOnboardingActionId } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { hubStateSelector } from "../reducer";

export function useCheckAccountWithFundsAction(
  completeAction: (action: PostOnboardingActionId) => void,
) {
  const hubState = useSelector(hubStateSelector);
  const isAssetTransferComplete =
    hubState.actionsCompleted?.[PostOnboardingActionId.assetsTransfer];

  const handleAccountsUpdate = useCallback(
    (accounts: Account[]) => {
      if (!isAssetTransferComplete) {
        const hasAccountsWithFunds = accounts.some(account => account?.balance.isGreaterThan(0));
        if (hasAccountsWithFunds) completeAction(PostOnboardingActionId.assetsTransfer);
      }
    },
    [completeAction, isAssetTransferComplete],
  );

  return handleAccountsUpdate;
}
