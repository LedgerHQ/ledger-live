import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { AddressInput, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../context/SendFlowContext";
import { useAvailableBalance } from "../hooks/useAvailableBalance";
import { MemoTypeSelect } from "../screens/Recipient/components/Memo/MemoTypeSelect";
import { MemoValueInput } from "../screens/Recipient/components/Memo/MemoValueInput";
import { SkipMemoSection } from "../screens/Recipient/components/Memo/SkipMemoSection";
import { useRecipientMemo } from "../screens/Recipient/hooks/useRecipientMemo";
import {
  SEND_FLOW_STEP,
  type SendFlowStep,
  type SendFlowBusinessContext,
} from "@ledgerhq/live-common/flows/send/types";
import type { SendStepConfig } from "../types";
import { getRecipientDisplayValue, getRecipientSearchPrefillValue } from "./utils";

export function SendHeader() {
  const wizard = useFlowWizard<SendFlowStep, SendFlowBusinessContext, SendStepConfig>();
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { close, transaction } = useSendFlowActions();
  const { t } = useTranslation();

  const { navigation, currentStep } = wizard;
  const currentStepConfig = wizard.currentStepConfig as SendStepConfig;

  const currencyId = state.account.currency?.id;

  const showRecipientInput = currentStepConfig?.addressInput ?? false;
  const showMemoControls = Boolean(
    showRecipientInput && uiConfig.hasMemo && recipientSearch.value.length > 0,
  );

  const memoDefaultOption = useMemo(() => {
    return state.account.currency
      ? sendFeatures.getMemoDefaultOption(state.account.currency)
      : undefined;
  }, [state.account.currency]);

  const memoTypeOptions = useMemo(() => {
    return uiConfig.memoOptions ?? [];
  }, [uiConfig]);
  const memoType = uiConfig.memoType;
  const memoMaxLength = uiConfig.memoMaxLength;

  const {
    hasMemoTypeOptions,
    memo,
    onMemoTypeChange,
    showMemoValueInput,
    onMemoValueChange,
    showSkipMemo,
    skipMemoState,
    onSkipMemoRequestConfirm,
    onSkipMemoCancelConfirm,
    onSkipMemoConfirm,
    resetViewState,
  } = useRecipientMemo({
    hasMemo: uiConfig.hasMemo,
    memoDefaultOption,
    memoType,
    memoTypeOptions,
    onMemoChange: memo => {
      transaction.setRecipient({ ...state.recipient, memo });
    },
    onMemoSkip: () => {
      navigation.goToNextStep();
    },
    resetKey: `${state.account.account?.id ?? ""}|${currencyId ?? ""}|${
      recipientSearch.value.length === 0 ? "empty" : "filled"
    }`,
  });

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

        resetViewState();
      }
      navigation.goToPreviousStep();
    } else {
      close();
    }
  }, [close, currentStep, navigation, resetViewState, transaction]);

  const showBackButton = navigation.canGoBack();
  const showTitle = currentStepConfig?.showTitle !== false;

  const title = showTitle ? t("newSendFlow.title", { currency: currencyName }) : "";
  const descriptionText =
    showTitle && availableText ? t("newSendFlow.available", { amount: availableText }) : "";

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

  const transactionErrorName = state.transaction.status?.errors?.transaction?.name;

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
      <>
        <AddressInput
          className="-mt-12 mb-12 px-24"
          value={addressInputValue}
          onChange={e => recipientSearch.setValue(e.target.value)}
          onClear={recipientSearch.clear}
          placeholder={
            uiConfig.recipientSupportsDomain
              ? t("newSendFlow.placeholder")
              : t("newSendFlow.placeholderNoENS")
          }
        />
        {showMemoControls && currencyId ? (
          <div className="mb-24 px-24">
            <div className="flex flex-col gap-12">
              {hasMemoTypeOptions ? (
                <MemoTypeSelect
                  currencyId={currencyId}
                  options={memoTypeOptions}
                  value={memo.type}
                  onChange={onMemoTypeChange}
                />
              ) : null}

              {showMemoValueInput ? (
                <MemoValueInput
                  currencyId={currencyId}
                  value={memo.value}
                  maxLength={memoMaxLength}
                  transactionErrorName={transactionErrorName}
                  onChange={onMemoValueChange}
                />
              ) : null}
            </div>

            {showSkipMemo ? (
              <SkipMemoSection
                currencyId={currencyId}
                state={skipMemoState}
                onRequestConfirm={onSkipMemoRequestConfirm}
                onCancelConfirm={onSkipMemoCancelConfirm}
                onConfirm={onSkipMemoConfirm}
              />
            ) : null}
          </div>
        ) : null}
      </>
    );
  }, [
    showRecipientInput,
    isAmountStep,
    addressInputValue,
    recipientSearch,
    uiConfig.recipientSupportsDomain,
    t,
    showMemoControls,
    currencyId,
    hasMemoTypeOptions,
    memo,
    onMemoTypeChange,
    showMemoValueInput,
    onMemoValueChange,
    showSkipMemo,
    skipMemoState,
    onSkipMemoRequestConfirm,
    onSkipMemoCancelConfirm,
    onSkipMemoConfirm,
    memoTypeOptions,
    memoMaxLength,
    transactionErrorName,
    handleRecipientInputClick,
  ]);

  return (
    <div className="flex flex-col">
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
