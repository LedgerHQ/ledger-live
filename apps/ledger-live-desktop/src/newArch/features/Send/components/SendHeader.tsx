import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import { AddressInput, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { AccountLike } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { useSendFlowContext } from "../context/SendFlowContext";

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
  const { navigation, state, close, currentStepConfig, uiConfig, recipientSearch } =
    useSendFlowContext();
  const { t } = useTranslation();

  const currencyName = state.account.currency?.ticker ?? "";
  const availableText = useAvailableBalance(state.account.account);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goToPreviousStep();
    } else {
      close();
    }
  }, [navigation, close]);

  const showBackButton = navigation.canGoBack();
  const showTitle = currentStepConfig?.showTitle !== false;

  const title = showTitle ? t("newSendFlow.title", { currency: currencyName }) : "";
  const descriptionText =
    showTitle && availableText ? t("newSendFlow.available", { amount: availableText }) : "";

  const showRecipientInput = currentStepConfig?.addressInput ?? false;

  return (
    <div className="flex flex-col gap-24">
      <DialogHeader
        appearance="compact"
        title={title}
        description={descriptionText || undefined}
        onBack={showBackButton ? handleBack : undefined}
        onClose={close}
      />
      {showRecipientInput ? (
        <AddressInput
          className="mb-24 px-24"
          value={recipientSearch.value}
          onChange={e => recipientSearch.setValue(e.target.value)}
          onClear={recipientSearch.clear}
          placeholder={
            uiConfig.recipientSupportsDomain
              ? t("newSendFlow.placeholder")
              : t("newSendFlow.placeholderNoENS")
          }
        />
      ) : null}
    </div>
  );
}
