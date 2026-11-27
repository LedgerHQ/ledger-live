import { useMemo, useCallback } from "react";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import type { BalanceTypeSelfTransferTarget } from "@ledgerhq/live-common/bridge/descriptor/types";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { useRecipientContinuation } from "../../../context/RecipientContinuationContext";
import { getAccountSelfTransferTarget } from "../../../utils/selfTransferTarget";

export type SelfTransferSectionViewModel = {
  target: BalanceTypeSelfTransferTarget;
  onSelfTransfer: (displayLabel: string) => void;
  isBlocked: boolean;
} | null;

export function useSelfTransferSectionViewModel(): SelfTransferSectionViewModel {
  const { state } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const { navigation } = useFlowWizard<SendFlowStep>();
  const { isFamilyRecipientBlocked } = useRecipientContinuation();

  const account = state.account.account;

  const target = useMemo(() => {
    if (!account) return null;
    return getAccountSelfTransferTarget(
      account,
      state.transaction.transaction,
      state.account.parentAccount,
    );
  }, [account, state.transaction.transaction, state.account.parentAccount]);

  // A destination that cannot carry a memo (Zcash public pool) drops it anyway, so a memo
  // typed for the previous recipient only matters when the destination accepts one.
  const memoAppliesToTarget = Boolean(
    account &&
    target &&
    sendFeatures.hasMemoForRecipient(getAccountCurrency(account), target.address),
  );
  const typedMemo = state.recipient?.memo;
  const hasTypedMemo = Boolean(
    typedMemo && typedMemo.type !== "NO_MEMO" && typedMemo.value.length > 0,
  );
  const isTypedMemoUnvalidated =
    memoAppliesToTarget &&
    hasTypedMemo &&
    (state.transaction.bridgePending || Boolean(state.transaction.status.errors.transaction));
  const isBlocked = isFamilyRecipientBlocked || isTypedMemoUnvalidated;

  const onSelfTransfer = useCallback(
    (displayLabel: string) => {
      if (!target || isBlocked) return;
      transaction.setRecipient({
        ...state.recipient,
        address: target.address,
        displayLabel,
        ensName: undefined,
        memo: memoAppliesToTarget ? state.recipient?.memo : undefined,
        // Prefilling the address is not enough: coins holding self-transfer state (Zcash
        // locks the recipient on it) never infer it from the address itself.
        isSelfTransfer: true,
      });
      navigation.goToNextStep();
    },
    [isBlocked, memoAppliesToTarget, target, transaction, state.recipient, navigation],
  );

  if (!target) return null;

  return { target, onSelfTransfer, isBlocked };
}
