import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AddressInput, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { useSendFlowData } from "../context/SendFlowContext";
import { useSendAmountDisplayMode } from "@ledgerhq/live-common/flows/send/amount/SendAmountDisplayModeContext";
import {
  SEND_FLOW_STEP,
  type SendFlowBusinessContext,
  type SendFlowStep,
} from "@ledgerhq/live-common/flows/send/types";
import { useAvailableBalance } from "../hooks/useAvailableBalance";
import { useSendHeaderMemo } from "../hooks/useSendHeaderMemo";
import { useSendHeaderModel } from "../hooks/useSendHeaderModel";
import { AddressDisclaimer } from "./AddressDisclaimer";
import { RecipientHeaderPrefix } from "./RecipientHeaderPrefix";
import { MemoTypeSelect } from "../screens/Recipient/components/Memo/MemoTypeSelect";
import { MemoValueInput } from "../screens/Recipient/components/Memo/MemoValueInput";
import { RecipientQrScanner } from "../screens/Recipient/components/RecipientQrScanner";
import type { SendStepConfig } from "../types";

export function SendHeader() {
  const wizard = useFlowWizard<SendFlowStep, SendFlowBusinessContext, SendStepConfig>();
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { displayMode } = useSendAmountDisplayMode();
  const { t } = useTranslation();
  const { currentStep } = wizard;

  const headerDisplayMode = currentStep === SEND_FLOW_STEP.COIN_CONTROL ? "crypto" : displayMode;
  const availableText = useAvailableBalance(state.account.account, headerDisplayMode);

  const {
    currencyId,
    hasMemoTypeOptions,
    memo,
    memoTypeOptions,
    onMemoTypeChange,
    showMemoValueInput,
    onMemoValueChange,
    resetViewState,
  } = useSendHeaderMemo();

  const {
    addressInputValue,
    descriptionText,
    handleBack,
    handleClose,
    handleRecipientInputClick,
    handleRecipientInputChange,
    handleRecipientPaste,
    handleQrCodeClick,
    handleScanPicked,
    isScannerOpen,
    recipientContact,
    recipientPlaceholder,
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
              readOnly
              hideClearButton
              prefix={
                <RecipientHeaderPrefix contact={recipientContact}>
                  {t("newSendFlow.to")}
                </RecipientHeaderPrefix>
              }
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
          className="-mt-12 mb-12 px-24"
          id="send-recipient-input"
          data-testid="send-recipient-input"
          autoFocus
          prefix={t("newSendFlow.to")}
          value={addressInputValue}
          onChange={e => handleRecipientInputChange(e.target.value)}
          onPaste={handleRecipientPaste}
          onClear={recipientSearch.clear}
          onQrCodeClick={handleQrCodeClick}
          placeholder={recipientPlaceholder}
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
          </div>
        ) : null}
      </>
    );
  }, [
    showRecipientInput,
    isAmountStep,
    addressInputValue,
    recipientContact,
    recipientPlaceholder,
    recipientSearch,
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
    handleRecipientInputClick,
    handleRecipientInputChange,
    handleRecipientPaste,
    handleQrCodeClick,
    handleScanPicked,
    isScannerOpen,
  ]);

  return (
    <div className="flex flex-col">
      <div data-testid="send-dialog-header">
        <DialogHeader
          density={wizard.currentStepConfig?.headerDensity ?? "compact"}
          title={title}
          description={descriptionText || undefined}
          onBack={showBackButton ? handleBack : undefined}
          onClose={handleClose}
        />
      </div>
      {recipientInputContent}
    </div>
  );
}
