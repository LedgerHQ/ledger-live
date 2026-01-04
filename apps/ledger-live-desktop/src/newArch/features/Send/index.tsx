import React, { useCallback } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { SendFlowOrchestrator } from "./SendFlowOrchestrator";
import { SEND_FLOW_STEP, type SendFlowInitParams } from "./types";
import { SignatureScreen } from "./screens/Signature/SignatureScreen";
import { ConfirmationScreen } from "./screens/Confirmation/ConfirmationScreen";
import { createStepRegistry } from "../FlowWizard/FlowWizardOrchestrator";
import { SendFlowLayout } from "./components/SendFlowLayout";

const stepRegistry = createStepRegistry({
  [SEND_FLOW_STEP.RECIPIENT]: () => <></>,
  [SEND_FLOW_STEP.AMOUNT]: () => <></>,
  [SEND_FLOW_STEP.SIGNATURE]: SignatureScreen,
  [SEND_FLOW_STEP.CONFIRMATION]: ConfirmationScreen,
});

type SendWorkflowParams = Readonly<{
  account?: AccountLike;
  parentAccount?: Account;
  recipient?: string;
  amount?: string;
  memo?: string;
  fromMAD?: boolean;
  startWithWarning?: boolean;
}>;

type SendWorkflowProps = Readonly<{
  onClose?: () => void;
  params?: SendWorkflowParams;
  isOpen: boolean;
}>;

export function SendWorkflow({ onClose, params, isOpen }: SendWorkflowProps) {
  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const initParams: SendFlowInitParams = {
    account: params?.account,
    parentAccount: params?.parentAccount,
    recipient: params?.recipient,
    amount: params?.amount,
    memo: params?.memo,
    fromMAD: params?.fromMAD ?? false,
  };

  return (
    <SendFlowOrchestrator initParams={initParams} onClose={handleClose} stepRegistry={stepRegistry}>
      <SendFlowLayout stepRegistry={stepRegistry} isOpen={isOpen} onClose={handleClose} />
    </SendFlowOrchestrator>
  );
}
