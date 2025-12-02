import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { DialogHeader } from "@ledgerhq/lumen-ui-react";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { SendFlowOrchestrator } from "./SendFlowOrchestrator";
import { SEND_FLOW_STEP, type SendFlowInitParams } from "./types";
import { useSendFlowContext } from "./context/SendFlowContext";
import { FLOW_STATUS } from "../FlowWizard/types";
import type { AnimationConfig } from "../FlowWizard/types";
import { AccountSelectionScreen } from "./screens/AccountSelection/AccountSelectionScreen";
import { RecipientScreen } from "./screens/Recipient/RecipientScreen";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { createStepRegistry } from "../FlowWizard/FlowWizardOrchestrator";

const SEND_ANIMATION_CONFIG: AnimationConfig = {
  forward: "animate-fade-in",
  backward: "animate-fade-in",
};

const stepRegistry = createStepRegistry({
  [SEND_FLOW_STEP.ACCOUNT_SELECTION]: AccountSelectionScreen,
  [SEND_FLOW_STEP.RECIPIENT]: RecipientScreen,
  [SEND_FLOW_STEP.AMOUNT]: () => <></>,
  [SEND_FLOW_STEP.SIGNATURE]: () => <></>,
  [SEND_FLOW_STEP.CONFIRMATION]: () => <></>,
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

function useAvailableBalance(account?: AccountLike | null) {
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const unit = useMaybeAccountUnit(account ?? undefined);

  const accountCurrency = useMemo(
    () => (account ? getAccountCurrency(account) : undefined),
    [account],
  );

  const counterValue = useCalculate({
    from: accountCurrency ?? counterValueCurrency,
    to: counterValueCurrency,
    value: account?.balance.toNumber() ?? 0,
    disableRounding: true,
  });

  const availableBalanceFormatted = useMemo(() => {
    if (!account || !unit) return "";
    return formatCurrencyUnit(unit, account.balance, {
      showCode: true,
      locale,
    });
  }, [account, unit, locale]);

  const counterValueFormatted = useMemo(() => {
    if (typeof counterValue !== "number" || !counterValueCurrency) return "";
    return formatCurrencyUnit(counterValueCurrency.units[0], new BigNumber(counterValue), {
      showCode: true,
      locale,
    });
  }, [counterValue, counterValueCurrency, locale]);

  return useMemo(() => {
    if (!account) return "";
    return counterValueFormatted || availableBalanceFormatted || "";
  }, [account, counterValueFormatted, availableBalanceFormatted]);
}

function useSendFlowHeaderViewModel() {
  const { navigation, state, close, currentStepConfig, currentStep } = useSendFlowContext();
  const { t } = useTranslation();

  const { account, currency } = state.account;
  const currencyName = currency?.ticker ?? "";
  const availableText = useAvailableBalance(account);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goToPreviousStep();
    } else {
      close();
    }
  }, [navigation, close]);

  const showHeader =
    currentStep !== SEND_FLOW_STEP.ACCOUNT_SELECTION && currentStepConfig?.showHeader !== false;
  const showBackButton = currentStep !== SEND_FLOW_STEP.ACCOUNT_SELECTION && navigation.canGoBack();
  const showTitle = currentStepConfig?.showTitle !== false;

  let statusGradientClass: string | null;
  if (state.flowStatus === FLOW_STATUS.ERROR) {
    statusGradientClass = "bg-gradient-error";
  } else if (state.flowStatus === FLOW_STATUS.SUCCESS) {
    statusGradientClass = "bg-gradient-success";
  } else {
    statusGradientClass = null;
  }

  return {
    showHeader,
    showBackButton,
    showTitle,
    currencyName,
    availableText,
    handleBack,
    close,
    statusGradientClass,
    t,
  };
}

function SendFlowDialogContent() {
  const {
    showHeader,
    showBackButton,
    showTitle,
    currencyName,
    availableText,
    handleBack,
    close,
    statusGradientClass,
    t,
  } = useSendFlowHeaderViewModel();

  let descriptionText = "";
  if (showTitle && availableText) {
    descriptionText = t("newSendFlow.available", { amount: availableText });
  }

  return (
    <>
      {showHeader && (
        <DialogHeader
          appearance="compact"
          className="px-24"
          title={showTitle ? t("newSendFlow.title", { currency: currencyName }) : ""}
          description={descriptionText}
          onBack={showBackButton ? handleBack : undefined}
          onClose={close}
        />
      )}
      {statusGradientClass && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-full ${statusGradientClass}`}
        />
      )}
    </>
  );
}

export function SendWorkflow({ onClose, params }: SendWorkflowProps) {
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
    <div className="flex flex-col text-base" data-testid="recipient-address-modal-content">
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
