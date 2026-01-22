import React, { useCallback } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { SendFlowOrchestrator } from "./SendFlowOrchestrator";
import { SEND_FLOW_STEP, type SendFlowInitParams } from "./types";
import { SignatureScreen } from "./screens/Signature/SignatureScreen";
import { ConfirmationScreen } from "./screens/Confirmation/ConfirmationScreen";
import { createStepRegistry } from "../FlowWizard/FlowWizardOrchestrator";
import { RecipientScreen } from "./screens/Recipient/RecipientScreen";
import { AmountScreen } from "./screens/Amount/AmountScreen";
import Navigator from "./Navigator";

export const stepRegistry = createStepRegistry({
  [SEND_FLOW_STEP.RECIPIENT]: RecipientScreen,
  [SEND_FLOW_STEP.AMOUNT]: AmountScreen,
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

export function SendWorkflow({ onClose, params, isOpen: _isOpen }: SendWorkflowProps) {
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

  // For React Native, we use the Navigator directly instead of a layout component
  // The Navigator handles the screen navigation and the FlowOrchestrator manages the state
  return (
    <SendFlowOrchestrator initParams={initParams} onClose={handleClose} stepRegistry={stepRegistry}>
      <Navigator />
    </SendFlowOrchestrator>
  );
}
