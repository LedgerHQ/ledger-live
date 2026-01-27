import React, { useCallback, useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { SEND_FLOW_STEP, type SendFlowInitParams } from "./types";
import { SignatureScreen } from "./screens/Signature/SignatureScreen";
import { ConfirmationScreen } from "./screens/Confirmation/ConfirmationScreen";
import { createStepRegistry, FlowWizardOrchestrator } from "../FlowWizard/FlowWizardOrchestrator";
import { SendFlowLayout } from "./components/SendFlowLayout";
import { RecipientScreen } from "./screens/Recipient/RecipientScreen";
import { useSendFlowBusinessLogic } from "./hooks/useSendFlowState";
import { SEND_FLOW_CONFIG } from "./constants";
import { SendFlowProvider } from "./context/SendFlowContext";

const stepRegistry = createStepRegistry({
  [SEND_FLOW_STEP.RECIPIENT]: RecipientScreen,
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

  const initParams: SendFlowInitParams = useMemo(
    () => ({
      account: params?.account,
      parentAccount: params?.parentAccount,
      recipient: params?.recipient,
      amount: params?.amount,
      memo: params?.memo,
      fromMAD: params?.fromMAD ?? false,
    }),
    [params],
  );

  const businessContext = useSendFlowBusinessLogic({ initParams, onClose: handleClose });

  const flowConfig = useMemo(
    () => ({
      ...SEND_FLOW_CONFIG,
      initialStep: SEND_FLOW_STEP.RECIPIENT,
    }),
    [],
  );

  return (
    <FlowWizardOrchestrator flowConfig={flowConfig} stepRegistry={stepRegistry}>
      <SendFlowProvider value={businessContext}>
        <SendFlowLayout isOpen={isOpen} onClose={handleClose} />
      </SendFlowProvider>
    </FlowWizardOrchestrator>
  );
}
