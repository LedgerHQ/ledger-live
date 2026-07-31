import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AddressInput, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { useSendFlowData, useSendFlowActions } from "../context/SendFlowContext";
import { useSendAmountDisplayMode } from "@ledgerhq/live-common/flows/send/amount/SendAmountDisplayModeContext";
import { track } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../utils/tracking";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import {
  SEND_FLOW_STEP,
  type SendFlowBusinessContext,
  type SendFlowStep,
} from "@ledgerhq/live-common/flows/send/types";
import { getMemoFamilyCurrencyId } from "@ledgerhq/live-common/flows/send/utils/memoFamilyCurrencyId";
import { useAvailableBalance } from "../hooks/useAvailableBalance";
import { useSendHeaderModel } from "../hooks/useSendHeaderModel";
import { AddressDisclaimer } from "./AddressDisclaimer";
import { MemoTypeSelect } from "../screens/Recipient/components/Memo/MemoTypeSelect";
import { MemoValueInput } from "../screens/Recipient/components/Memo/MemoValueInput";
import { SkipMemoSection } from "../screens/Recipient/components/Memo/SkipMemoSection";
import { useRecipientMemo } from "../screens/Recipient/hooks/useRecipientMemo";
import { RecipientQrScanner } from "../screens/Recipient/components/RecipientQrScanner";
import type { SendStepConfig } from "../types";

export function SendHeader() {
  const wizard = useFlowWizard<SendFlowStep, SendFlowBusinessContext, SendStepConfig>();
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { close, transaction } = useSendFlowActions();
  const { displayMode } = useSendAmountDisplayMode();
  const { t } = useTranslation();
  const { navigation, currentStep } = wizard;

  const headerDisplayMode = currentStep === SEND_FLOW_STEP.COIN_CONTROL ? "crypto" : displayMode;
  const availableText = useAvailableBalance(state.account.account, headerDisplayMode);

  const currencyId = getMemoFamilyCurrencyId(state.account.currency);

  const sendFlowTrackingProperties = useMemo(
    () => getSendFlowTrackingProperties(state.account.account, state.account.parentAccount),
    [state.account.account, state.account.parentAccount],
  );

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
      const address = state.recipient?.address ?? recipientSearch.value;
      transaction.setRecipient({ ...state.recipient, address, memo });
    },
    onMemoSkip: () => {
      track("button_clicked", {
        button: "skip memo",
        page: "step recipient",
        ...sendFlowTrackingProperties,
      });
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
    handleRecipientInputChange,
    handleQrCodeClick,
    handleScanPicked,
    isScannerOpen,
    showBackButton,
    showMemoControls,
    showRecipientInput,
    title,
    transactionErrorName,
    transactionError,
  } = useSendHeaderModel({ availableText, resetViewState });

  const isAmountStep = currentStep === SEND_FLOW_STEP.AMOUNT;

  const recipientInputContent = useMemo(() => {
    if (!showRecipientInput) return null;

    if (isAmountStep) {
      return (
        <div className="-mt-12 mb-24 px-24">
          <div className="relative">
            <AddressInput
              className="w-full"
              value={addressInputValue}
              hideClearButton
              prefix={t("newSendFlow.to")}
              suffix={<AddressDisclaimer />}
            />
            {/* Stops short of the trailing info icon so the disclaimer stays hoverable. */}
            <button
              type="button"
              className="absolute inset-y-0 left-0 right-56"
              aria-label="Edit recipient"
              data-testid="send-edit-recipient-button"
              onClick={handleRecipientInputClick}
            />
          </div>
        </div>
      );
    }

    return (
      <>
        <AddressInput
          className="mb-12 px-24"
          id="send-recipient-input"
          data-testid="send-recipient-input"
          autoFocus
          prefix={t("newSendFlow.to")}
          value={addressInputValue}
          onChange={e => handleRecipientInputChange(e.target.value)}
          onClear={recipientSearch.clear}
          onQrCodeClick={handleQrCodeClick}
          placeholder={
            uiConfig.recipientSupportsDomain
              ? t("newSendFlow.placeholder")
              : t("newSendFlow.placeholderNoENS")
          }
        />
        {isScannerOpen && <RecipientQrScanner onPick={handleScanPicked} />}
        {showMemoControls && currencyId ? (
          <div className="px-24">
            <div className="flex flex-col gap-12">
              {hasMemoTypeOptions && (
                <MemoTypeSelect
                  currencyId={currencyId}
                  options={memoTypeOptions}
                  value={memo.type}
                  onChange={onMemoTypeChange}
                />
              )}

              {showMemoValueInput ? (
                <MemoValueInput
                  currencyId={currencyId}
                  value={memo.value}
                  maxLength={uiConfig.memoMaxLength}
                  memoType={uiConfig.memoType}
                  memoMaxValue={uiConfig.memoMaxValue}
                  transactionError={transactionError}
                  transactionErrorName={transactionErrorName}
                  onChange={onMemoValueChange}
                />
              ) : null}
            </div>

            {showSkipMemo && !transactionError && (
              <SkipMemoSection
                currencyId={currencyId}
                state={skipMemoState}
                onRequestConfirm={onSkipMemoRequestConfirm}
                onCancelConfirm={onSkipMemoCancelConfirm}
                onConfirm={onSkipMemoConfirm}
              />
            )}
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
    uiConfig.memoType,
    uiConfig.memoMaxValue,
    t,
    showMemoControls,
    currencyId,
    hasMemoTypeOptions,
    memoTypeOptions,
    memo.type,
    memo.value,
    onMemoTypeChange,
    showMemoValueInput,
    transactionError,
    transactionErrorName,
    onMemoValueChange,
    showSkipMemo,
    skipMemoState,
    onSkipMemoRequestConfirm,
    onSkipMemoCancelConfirm,
    onSkipMemoConfirm,
    handleRecipientInputClick,
    handleRecipientInputChange,
    handleQrCodeClick,
    handleScanPicked,
    isScannerOpen,
  ]);

  return (
    <div className="flex flex-col">
      <div data-testid="send-dialog-header">
        <DialogHeader
          density="compact"
          title={title}
          description={descriptionText || undefined}
          onBack={showBackButton ? handleBack : undefined}
          onClose={close}
        />
      </div>
      {recipientInputContent}
    </div>
  );
}
