import { useCallback } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { useLLDCoinFamily } from "~/renderer/families";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";

export function useBalanceTypeSyncScreenViewModel() {
  const { state } = useSendFlowData();
  const { close } = useSendFlowActions();
  const { navigation } = useFlowWizard();

  const accountLike = state.account.account;
  const mainAccount = accountLike
    ? getMainAccount(accountLike, state.account.parentAccount)
    : undefined;
  const { SendBalanceTypeSync } = useLLDCoinFamily(mainAccount?.currency.family);

  const onComplete = useCallback(() => {
    navigation.resetToStep(SEND_FLOW_STEP.BALANCE_TYPE);
    navigation.goToStep(SEND_FLOW_STEP.RECIPIENT);
  }, [navigation]);

  return {
    SendBalanceTypeSync,
    account: mainAccount,
    transaction: state.transaction.transaction,
    onComplete,
    onClose: close,
  };
}
