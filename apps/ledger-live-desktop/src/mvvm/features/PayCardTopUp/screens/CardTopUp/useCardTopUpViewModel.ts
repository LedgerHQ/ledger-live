import { useCallback, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit, parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { useCardTopUpExecution } from "../../hooks/useCardTopUpExecution";
import type { CardTopUpData, CardTopUpViewModel } from "./types";

const KEY_PREFIX = "payTab.card.fund";

export function useCardTopUpViewModel(
  data: CardTopUpData,
  onClose: () => void,
): CardTopUpViewModel {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const [amountText, setAmountText] = useState("");
  const currency = useMemo(() => getAccountCurrency(data.account), [data.account]);
  const sourceAccountName = useMaybeAccountName(data.account) ?? currency.name;
  const unit = currency.units[0];
  const maxDecimalLength = Math.max(0, unit?.magnitude ?? 0);
  const normalizedAmount = amountText.replace(",", ".");

  const amountError = useMemo(() => {
    if (!amountText) return null;

    const decimalAmount = new BigNumber(normalizedAmount);
    if (!decimalAmount.isFinite() || !decimalAmount.isGreaterThan(0)) {
      return t(`${KEY_PREFIX}.invalidAmount`);
    }
    if ((decimalAmount.decimalPlaces() ?? 0) > maxDecimalLength || !unit) {
      return t(`${KEY_PREFIX}.invalidPrecision`);
    }
    if (parseCurrencyUnit(unit, normalizedAmount).isGreaterThan(data.account.spendableBalance)) {
      return t(`${KEY_PREFIX}.insufficientBalance`);
    }
    return null;
  }, [amountText, data.account.spendableBalance, maxDecimalLength, normalizedAmount, t, unit]);

  const availableBalance = unit
    ? formatCurrencyUnit(unit, data.account.spendableBalance, { showCode: true, locale })
    : "";
  const canSubmit = amountText.length > 0 && amountError === null;
  const { deviceStep, execute, reset, onDeviceError } = useCardTopUpExecution(data);

  const onSubmit = useCallback(() => {
    if (canSubmit) void execute(normalizedAmount);
  }, [canSubmit, execute, normalizedAmount]);

  return {
    asset: data.asset,
    amountText,
    maxDecimalLength,
    availableBalance,
    sourceAccountName,
    amountError,
    canSubmit,
    deviceStep,
    onAmountChange: setAmountText,
    onSubmit,
    onRetry: reset,
    onDeviceError,
    onClose,
  };
}
