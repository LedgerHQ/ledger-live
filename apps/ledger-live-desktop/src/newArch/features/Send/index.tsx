import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { DialogHeader } from "@ledgerhq/ldls-ui-react";
import { SendFlowOrchestrator, createStepRegistry } from "./SendFlowOrchestrator";
import { SEND_FLOW_STEP, type SendFlowInitParams } from "./types";
import { useSendFlowContext } from "./context/SendFlowContext";
import { FLOW_STATUS } from "../FlowWizard/types";
import { useDialog } from "LLD/components/Dialog";
import { AccountSelectionScreen } from "./screens/AccountSelection/AccountSelectionScreen";

import type { AnimationConfig } from "../FlowWizard/types";
import { RecipientScreen } from "./screens/Recipient/RecipientScreen";
import { AmountScreen } from "./screens/Amount/AmountScreen";
import { SignatureScreen } from "./screens/Signature/SignatureScreen";
import { ConfirmationScreen } from "./screens/Confirmation/ConfirmationScreen";

const SEND_ANIMATION_CONFIG: AnimationConfig = {
  forward: "animate-fade-in",
  backward: "animate-fade-in",
};

const stepRegistry = createStepRegistry({
  [SEND_FLOW_STEP.ACCOUNT_SELECTION]: AccountSelectionScreen,
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
}>;

function SendFlowDialogContent() {
  const { navigation, state, close, currentStepConfig, currentStep } = useSendFlowContext();
  const { t } = useTranslation();

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goToPreviousStep();
    } else {
      close();
    }
  }, [navigation, close]);

  const { account, currency } = state.account;
  const availableBalance = account?.balance.toString() ?? "0";
  const currencyName = currency?.ticker ?? "";

  const showHeader =
    currentStep !== SEND_FLOW_STEP.ACCOUNT_SELECTION && currentStepConfig?.showHeader !== false;
  const showBackButton = currentStep !== SEND_FLOW_STEP.ACCOUNT_SELECTION && navigation.canGoBack();

  const statusGradientClass =
    state.flowStatus === FLOW_STATUS.ERROR
      ? "bg-gradient-error"
      : state.flowStatus === FLOW_STATUS.SUCCESS
        ? "bg-gradient-success"
        : null;

  return (
    <>
      {showHeader && (
        <div className="px-6 pt-6">
          <DialogHeader
            appearance="compact"
            title={t("newSendFlow.title", { currency: currencyName })}
            description={t("newSendFlow.available", { amount: availableBalance })}
            onBack={showBackButton ? handleBack : undefined}
            onClose={close}
          />
        </div>
      )}
      {statusGradientClass && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-full ${statusGradientClass}`}
        />
      )}
    </>
  );
}

export default function SendWorkflow({ onClose, params }: SendWorkflowProps) {
  const { closeDialog } = useDialog();

  const handleClose = useCallback(() => {
    closeDialog();
    onClose?.();
  }, [closeDialog, onClose]);

  const initParams: SendFlowInitParams = {
    account: params?.account,
    parentAccount: params?.parentAccount,
    recipient: params?.recipient,
    amount: params?.amount,
    memo: params?.memo,
    fromMAD: params?.fromMAD ?? false,
  };

  return (
    <div
      className="flex h-[612px] flex-col text-base"
      data-testid="recipient-address-modal-content"
    >
      <SendFlowOrchestrator
        initParams={initParams}
        onClose={handleClose}
        stepRegistry={stepRegistry}
        animationConfig={SEND_ANIMATION_CONFIG}
      >
        <SendFlowDialogContent />
      </SendFlowOrchestrator>
    </div>
  );
}
