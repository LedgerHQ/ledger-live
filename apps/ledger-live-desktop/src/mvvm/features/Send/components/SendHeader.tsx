import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import {
  SEND_FLOW_STEP,
  type SendFlowBusinessContext,
  type SendFlowStep,
} from "@ledgerhq/live-common/flows/send/types";
import { AddressInput, DialogHeader } from "@ledgerhq/lumen-ui-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { useSendFlowActions, useSendFlowData } from "../context/SendFlowContext";
import { useAvailableBalance } from "../hooks/useAvailableBalance";
import { useSendHeaderModel } from "../hooks/useSendHeaderModel";
import { MemoTypeSelect } from "../screens/Recipient/components/Memo/MemoTypeSelect";
import { MemoValueInput } from "../screens/Recipient/components/Memo/MemoValueInput";
import { SkipMemoSection } from "../screens/Recipient/components/Memo/SkipMemoSection";
import { useRecipientMemo } from "../screens/Recipient/hooks/useRecipientMemo";
import type { SendStepConfig } from "../types";

export function SendHeader() {
  const wizard = useFlowWizard<SendFlowStep, SendFlowBusinessContext, SendStepConfig>();
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { close, transaction } = useSendFlowActions();
  const { t } = useTranslation();
  const availableText = useAvailableBalance(state.account.account);

  const { navigation, currentStep } = wizard;
  const currencyId = state.account.currency?.id;

  const memoDefaultOption = useMemo(() => {
    return sendFeatures.getMemoDefaultOption(state.account.currency ?? undefined);
  }, [state.account.currency]);

  const memoTypeOptions = useMemo(() => {
    return uiConfig.memoOptions ?? [];
  }, [uiConfig]);

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
    memoType: uiConfig.memoType,
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

  const {
    addressInputValue,
    descriptionText,
    handleBack,
    handleRecipientInputClick,
    showBackButton,
    showMemoControls,
    showRecipientInput,
    title,
    transactionErrorName,
  } = useSendHeaderModel({ availableText, resetViewState });

  const isAmountStep = currentStep === SEND_FLOW_STEP.AMOUNT;

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
                  maxLength={uiConfig.memoMaxLength}
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
    uiConfig.memoMaxLength,
    t,
    showMemoControls,
    currencyId,
    hasMemoTypeOptions,
    memoTypeOptions,
    memo.type,
    memo.value,
    onMemoTypeChange,
    showMemoValueInput,
    transactionErrorName,
    onMemoValueChange,
    showSkipMemo,
    skipMemoState,
    onSkipMemoRequestConfirm,
    onSkipMemoCancelConfirm,
    onSkipMemoConfirm,
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
