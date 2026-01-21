import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { AddressInput, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { AccountLike } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { BigNumber } from "bignumber.js";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import {
  SEND_FLOW_STEP,
  type SendFlowStep,
  type SendFlowBusinessContext,
} from "@ledgerhq/live-common/flows/send/types";
import type { SendStepConfig } from "../types";
import { useSendFlowActions, useSendFlowData } from "../context/SendFlowContext";
import { MemoTypeSelect } from "../screens/Recipient/components/Memo/MemoTypeSelect";
import { MemoValueInput } from "../screens/Recipient/components/Memo/MemoValueInput";
import { SkipMemoSection } from "../screens/Recipient/components/Memo/SkipMemoSection";
import { useRecipientMemo } from "../screens/Recipient/hooks/useRecipientMemo";
import { getRecipientDisplayValue, getRecipientSearchPrefillValue } from "./utils";

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

export function SendHeader() {
  const wizard = useFlowWizard<SendFlowStep, SendFlowBusinessContext, SendStepConfig>();
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { close, transaction } = useSendFlowActions();
  const { t } = useTranslation();

  const { navigation, currentStep } = wizard;
  const currentStepConfig = wizard.currentStepConfig as SendStepConfig;

  const currencyName = state.account.currency?.ticker ?? "";
  const availableText = useAvailableBalance(state.account.account);

  const showBackButton = navigation.canGoBack();
  const showTitle = currentStepConfig?.showTitle !== false;

  const title = showTitle ? t("newSendFlow.title", { currency: currencyName }) : "";
  const descriptionText =
    showTitle && availableText ? t("newSendFlow.available", { amount: availableText }) : "";

  const showRecipientInput = currentStepConfig?.addressInput ?? false;
  const isAmountStep = currentStep === SEND_FLOW_STEP.AMOUNT;

  const addressInputValue = useMemo(() => {
    if (isAmountStep) return getRecipientDisplayValue(state.recipient);
    return recipientSearch.value;
  }, [isAmountStep, recipientSearch.value, state.recipient]);

  const showMemoControls = Boolean(
    showRecipientInput && uiConfig.hasMemo && recipientSearch.value.length > 0,
  );

  const currencyId = state.account.currency?.id;
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

  const memoViewModel = useRecipientMemo({
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

        memoViewModel.resetViewState();
      }
      navigation.goToPreviousStep();
    } else {
      close();
    }
  }, [close, currentStep, memoViewModel, navigation, transaction]);

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
              {memoViewModel.hasMemoTypeOptions ? (
                <MemoTypeSelect
                  currencyId={currencyId}
                  options={memoTypeOptions}
                  value={memoViewModel.memo.type}
                  onChange={memoViewModel.onMemoTypeChange}
                />
              ) : null}

              {memoViewModel.showMemoValueInput ? (
                <MemoValueInput
                  currencyId={currencyId}
                  value={memoViewModel.memo.value}
                  maxLength={memoMaxLength}
                  transactionErrorName={transactionErrorName}
                  onChange={memoViewModel.onMemoValueChange}
                />
              ) : null}
            </div>

            {memoViewModel.showSkipMemo ? (
              <SkipMemoSection
                currencyId={currencyId}
                state={memoViewModel.skipMemoState}
                onRequestConfirm={memoViewModel.onSkipMemoRequestConfirm}
                onCancelConfirm={memoViewModel.onSkipMemoCancelConfirm}
                onConfirm={memoViewModel.onSkipMemoConfirm}
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
    memoViewModel.showMemoValueInput,
    memoViewModel.showSkipMemo,
    memoViewModel.hasMemoTypeOptions,
    memoViewModel.memo.type,
    memoViewModel.memo.value,
    memoViewModel.onMemoTypeChange,
    memoViewModel.onMemoValueChange,
    memoViewModel.skipMemoState,
    memoViewModel.onSkipMemoRequestConfirm,
    memoViewModel.onSkipMemoCancelConfirm,
    memoViewModel.onSkipMemoConfirm,
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
