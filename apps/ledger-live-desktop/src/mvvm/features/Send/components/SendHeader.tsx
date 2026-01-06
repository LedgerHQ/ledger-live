import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { BigNumber } from "bignumber.js";
import { AddressInput, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { formatAddress } from "@ledgerhq/react-ui/pre-ldls/components/Address/formatAddress";
import type { AccountLike } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import {
  useSendFlowNavigation,
  useSendFlowData,
  useSendFlowActions,
} from "../context/SendFlowContext";
import { SEND_FLOW_STEP } from "../types";

type RecipientLike = Readonly<{
  address: string;
  ensName?: string;
}>;

function getRecipientDisplayValue(recipient: RecipientLike | null): string {
  if (!recipient) return "";

  const formattedAddress = formatAddress(recipient.address, {
    prefixLength: 5,
    suffixLength: 5,
  });

  if (recipient.ensName) {
    return `${recipient.ensName} (${formattedAddress})`;
  }

  return formattedAddress;
}

function getRecipientSearchPrefillValue(recipient: RecipientLike | null): string {
  if (!recipient) return "";
  return recipient.ensName ?? recipient.address;
}

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
  const { navigation, currentStep, currentStepConfig } = useSendFlowNavigation();
  const { state, uiConfig, recipientSearch } = useSendFlowData();
  const { close, transaction } = useSendFlowActions();
  const { t } = useTranslation();

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

  return (
    <div className="-mb-12 flex flex-col">
      <DialogHeader
        appearance="compact"
        title={title}
        description={descriptionText || undefined}
        onBack={showBackButton ? handleBack : undefined}
        onClose={close}
      />
      {showRecipientInput ? (
        isAmountStep ? (
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
        ) : (
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
        )
      ) : null}
    </div>
  );
}
