import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { AddressInput, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { useSendFlowData, useSendFlowActions } from "../context/SendFlowContext";
import {
  SEND_FLOW_STEP,
  type SendFlowStep,
  type SendFlowBusinessContext,
} from "@ledgerhq/live-common/flows/send/types";
import type { SendStepConfig } from "../types";
import {
  getRecipientDisplayValue,
  getRecipientSearchPrefillValue,
} from "@ledgerhq/live-common/flows/send/utils";
import { useAvailableBalance } from "../hooks/useAvailableBalance";

export function SendHeader() {
  const wizard = useFlowWizard<SendFlowStep, SendFlowBusinessContext, SendStepConfig>();
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { close, transaction } = useSendFlowActions();
  const { t } = useTranslation();

  const { navigation, currentStep } = wizard;
  const currentStepConfig = wizard.currentStepConfig as SendStepConfig;

  const currencyName = state.account.currency?.ticker ?? "";
  const availableText = useAvailableBalance(state.account.account);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      // Reset amount-related state when leaving Amount step (back navigation),
      // otherwise the transaction amount can persist while the UI remounts empty.
      if (currentStep === SEND_FLOW_STEP.AMOUNT) {
        transaction.updateTransaction(tx => ({
          ...tx,
          amount: new BigNumber(0),
          useAllAmount: false,
          feesStrategy: null,
        }));
      }
      navigation.goToPreviousStep();
    } else {
      close();
    }
  }, [close, currentStep, navigation, transaction]);

  const showBackButton = navigation.canGoBack();
  const showTitle = currentStepConfig?.showTitle !== false;

  const title = showTitle ? t("newSendFlow.title", { currency: currencyName }) : "";
  const descriptionText =
    showTitle && availableText ? t("newSendFlow.available", { amount: availableText }) : "";

  const showRecipientInput = currentStepConfig?.addressInput ?? false;
  const isRecipientStep = currentStep === SEND_FLOW_STEP.RECIPIENT;
  const isAmountStep = currentStep === SEND_FLOW_STEP.AMOUNT;

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

  const recipientInputContent = useMemo(() => {
    if (!showRecipientInput) return null;

    if (isAmountStep) {
      return (
        <div className="-mt-12 mb-24 px-24">
          <div className="relative">
            <AddressInput className="w-full" defaultValue={addressInputValue} hideClearButton />
            <button
              type="button"
              className="absolute inset-0"
              aria-label="Edit recipient"
              onClick={handleRecipientInputClick}
            />
          </div>
        </div>
      );
    }

    return (
      <AddressInput
        className="-mt-12 mb-24 px-24"
        defaultValue={addressInputValue}
        onChange={e => recipientSearch.setValue(e.target.value)}
        onClear={recipientSearch.clear}
        placeholder={
          uiConfig.recipientSupportsDomain
            ? t("newSendFlow.placeholder")
            : t("newSendFlow.placeholderNoENS")
        }
      />
    );
  }, [
    showRecipientInput,
    isAmountStep,
    addressInputValue,
    handleRecipientInputClick,
    recipientSearch,
    uiConfig.recipientSupportsDomain,
    t,
  ]);

  return (
    <div className="-mb-12 flex flex-col">
      <DialogHeader
        appearance="compact"
        title={title}
        description={descriptionText || undefined}
        onBack={showBackButton ? handleBack : undefined}
        onClose={close}
      />
      {recipientInputContent}
    </div>
  );
}
