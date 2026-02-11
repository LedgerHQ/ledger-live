import React, { useCallback, useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { SendFlowOrchestrator } from "./SendFlowOrchestrator";
import {
  SEND_FLOW_STEP,
  type SendFlowStep,
  type SendFlowInitParams,
} from "@ledgerhq/live-common/flows/send/types";
import { SignatureScreen } from "./screens/Signature/SignatureScreen";
import { ConfirmationScreen } from "./screens/Confirmation/ConfirmationScreen";
import { SendFlowLayout } from "./components/SendFlowLayout";
import { RecipientScreen } from "./screens/Recipient/RecipientScreen";
import { AmountScreen } from "./screens/Amount/AmountScreen";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";

const stepRegistry: StepRegistry<SendFlowStep> = {
  [SEND_FLOW_STEP.RECIPIENT]: RecipientScreen,
  [SEND_FLOW_STEP.AMOUNT]: AmountScreen,
  [SEND_FLOW_STEP.SIGNATURE]: SignatureScreen,
  [SEND_FLOW_STEP.CONFIRMATION]: ConfirmationScreen,
};

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

  return (
    <SendFlowOrchestrator initParams={initParams} onClose={handleClose} stepRegistry={stepRegistry}>
      <SendFlowLayout isOpen={isOpen} onClose={handleClose} />
    </SendFlowOrchestrator>
  );
}
