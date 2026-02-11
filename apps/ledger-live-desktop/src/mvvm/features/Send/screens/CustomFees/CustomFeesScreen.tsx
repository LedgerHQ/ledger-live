import React, { useCallback } from "react";
import { useSendFlowData, useSendFlowActions } from "../../context/SendFlowContext";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import { CustomFeesScreenInner } from "./components/CustomFeesScreenInner";

export function CustomFeesScreen() {
  const { state } = useSendFlowData();
  const { transaction: transactionActions } = useSendFlowActions();
  const { navigation } = useFlowWizard();

  const { account, parentAccount } = state.account;
  const { transaction, status } = state.transaction;

  const handleConfirm = useCallback(() => {
    // Revenir à l'étape Amount après confirmation
    navigation.goToPreviousStep();
  }, [navigation]);

  const handleBack = useCallback(() => {
    // Revenir à l'étape Amount
    navigation.goToPreviousStep();
  }, [navigation]);

  if (!account || !transaction || !status) {
    return null;
  }

  return (
    <CustomFeesScreenInner
      account={account}
      parentAccount={parentAccount}
      transaction={transaction}
      status={status}
      transactionActions={transactionActions}
      onConfirm={handleConfirm}
      onBack={handleBack}
    />
  );
}
