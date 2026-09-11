import { useMemo, useCallback } from "react";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import type { BalanceTypeSelfTransferTarget } from "@ledgerhq/live-common/bridge/descriptor/types";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";

export type SelfTransferSectionViewModel = {
  target: BalanceTypeSelfTransferTarget;
  onSelfTransfer: (displayLabel: string) => void;
} | null;

export function useSelfTransferSectionViewModel(): SelfTransferSectionViewModel {
  const { state } = useSendFlowData();
  const { transaction } = useSendFlowActions();
  const { navigation } = useFlowWizard<SendFlowStep>();

  const account = state.account.account;

  const target = useMemo(() => {
    if (!account) return null;
    const config = sendFeatures.getBalanceTypeConfig(getAccountCurrency(account));
    return (
      config?.getSelfTransferTarget({
        account,
        transaction: state.transaction.transaction,
      }) ?? null
    );
  }, [account, state.transaction.transaction]);

  const onSelfTransfer = useCallback(
    (displayLabel: string) => {
      if (!target) return;
      transaction.setRecipient({
        ...(state.recipient ?? {}),
        address: target.address,
        displayLabel,
        ensName: undefined,
        // Prefilling the address is not enough: coins holding self-transfer state (Zcash
        // locks the recipient on it) never infer it from the address itself.
        isSelfTransfer: true,
      });
      navigation.goToNextStep();
    },
    [target, transaction, state.recipient, navigation],
  );

  if (!target) return null;

  return { target, onSelfTransfer };
}
