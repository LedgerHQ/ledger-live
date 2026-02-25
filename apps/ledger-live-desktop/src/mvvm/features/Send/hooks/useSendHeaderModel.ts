import { SendFlowStep, SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { t } from "i18next";
import { useMemo, useCallback } from "react";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import {
  getRecipientDisplayValue,
  getRecipientSearchPrefillValue,
} from "@ledgerhq/live-common/flows/send/utils";
import {
  SendFlowBusinessContext,
  useSendFlowActions,
  useSendFlowData,
} from "../context/SendFlowContext";
import { SendStepConfig } from "../types";
import BigNumber from "bignumber.js";

type UseSendHeaderModelParams = Readonly<{
  availableText: string;
  resetViewState: () => void;
}>;
type UseSendHeaderModelResult = Readonly<{
  addressInputValue: string | undefined;
  descriptionText: string | undefined;
  handleBack: () => void;
  handleRecipientInputClick: () => void;
  showBackButton: boolean;
  showRecipientInput: boolean;
  showMemoControls: boolean;
  title: string | undefined;
  transactionErrorName: string | undefined;
  transactionError: Error | undefined;
}>;

export function useSendHeaderModel({
  availableText,
  resetViewState,
}: UseSendHeaderModelParams): UseSendHeaderModelResult {
  const wizard = useFlowWizard<SendFlowStep, SendFlowBusinessContext, SendStepConfig>();
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { close, transaction } = useSendFlowActions();

  const currencyName = state.account.currency?.ticker ?? "";

  const { navigation, currentStep } = wizard;
  const currentStepConfig = wizard.currentStepConfig;

  const showRecipientInput = currentStepConfig?.addressInput ?? false;
  const showMemoControls = Boolean(
    showRecipientInput && uiConfig.hasMemo && recipientSearch.value.length > 0,
  );

  const backTarget = currentStepConfig?.backTarget;

  const showBackButton = navigation.canGoBack();

  const showTitle = currentStepConfig?.showTitle !== false;
  const titleKey = currentStepConfig?.titleKey;

  let title: string;
  if (titleKey) {
    title = t(titleKey);
  } else if (showTitle) {
    title = t("newSendFlow.title", { currency: currencyName });
  } else {
    title = "";
  }
  const descriptionText =
    showTitle && availableText ? t("newSendFlow.available", { amount: availableText }) : "";

  const isRecipientStep = currentStep === SEND_FLOW_STEP.RECIPIENT;
  const isAmountStep = currentStep === SEND_FLOW_STEP.AMOUNT;

  const handleBack = useCallback(() => {
    // Per-step state cleanup that runs regardless of whether navigation uses backTarget
    // or goToPreviousStep, so floating steps and regular steps are treated uniformly
    if (currentStep === SEND_FLOW_STEP.AMOUNT) {
      // Reset amount-related fields so they don't persist when the screen remounts
      transaction.updateTransaction(tx => ({
        ...tx,
        amount: new BigNumber(0),
        useAllAmount: false,
        feesStrategy: null,
      }));
      resetViewState();
    } else if (currentStep === SEND_FLOW_STEP.COIN_CONTROL) {
      // Reset UTXO exclusions so the selection doesn't bleed into the next visit
      transaction.updateTransaction(tx => {
        if (!("utxoStrategy" in tx)) return tx;
        return { ...tx, utxoStrategy: { ...tx.utxoStrategy, excludeUTXOs: [] } };
      });
    }

    if (backTarget) {
      navigation.goToStep(backTarget);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goToPreviousStep();
    } else {
      close();
    }
  }, [backTarget, close, currentStep, navigation, resetViewState, transaction]);

  const addressInputValue = useMemo(() => {
    if (isRecipientStep) return recipientSearch.value;
    if (isAmountStep) return getRecipientDisplayValue(state.recipient);
    return recipientSearch.value;
  }, [isRecipientStep, isAmountStep, recipientSearch.value, state.recipient]);

  const handleRecipientInputClick = useCallback(() => {
    if (!isAmountStep) return;

    const prefillValue = getRecipientSearchPrefillValue(state.recipient);
    if (prefillValue) {
      recipientSearch.setValue(prefillValue);
    }

    handleBack();
  }, [handleBack, isAmountStep, recipientSearch, state.recipient]);

  const transactionError = state.transaction.status?.errors?.transaction;
  const transactionErrorName = transactionError?.name;

  return {
    addressInputValue,
    descriptionText,
    handleBack,
    handleRecipientInputClick,
    showBackButton,
    showMemoControls,
    showRecipientInput,
    title,
    transactionErrorName,
    transactionError: transactionError instanceof Error ? transactionError : undefined,
  };
}
