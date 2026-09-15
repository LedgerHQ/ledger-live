import { useMemo, useCallback } from "react";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
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
    return getAccountSelfTransferTarget(account, state.transaction.transaction);
  }, [account, state.transaction.transaction]);

  const onSelfTransfer = useCallback(
    (displayLabel: string) => {
      if (!target || isFamilyRecipientBlocked) return;
      transaction.setRecipient({
        ...state.recipient,
        address: target.address,
        displayLabel,
        ensName: undefined,
        // Prefilling the address is not enough: coins holding self-transfer state (Zcash
        // locks the recipient on it) never infer it from the address itself.
        isSelfTransfer: true,
      });
      navigation.goToNextStep();
    },
    [isFamilyRecipientBlocked, target, transaction, state.recipient, navigation],
  );

  if (!target) return null;

  return { target, onSelfTransfer, isBlocked: isFamilyRecipientBlocked };
}
