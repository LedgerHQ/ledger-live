import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import BigNumber from "bignumber.js";

export type CustomFeeInputState = Readonly<{
  key: string;
  label: string;
  value: string;
  error: string | null;
  suggestedRange: { min: string; max: string } | null;
  helperLabel: string | null;
  helperValue: string | null;
}>;

export type CustomFeesViewModel = Readonly<{
  inputs: readonly CustomFeeInputState[];
  fiatLabel: string | null;
  fiatValue: string | null;
  isConfirmDisabled: boolean;
  onInputChange: (key: string, value: string) => void;
  onInputClear: (key: string) => void;
  onConfirm: () => void;
}>;

type CustomFeesViewModelProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  currency: CryptoOrTokenCurrency;
  transactionActions: SendFlowTransactionActions;
  onConfirm: () => void;
  onBack: () => void;
}>;

function isValidNumber(value: string): boolean {
  if (!value.trim()) return false;
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}

export function useCustomFeesViewModel({
  transaction,
  status,
  currency,
  transactionActions,
  onConfirm,
}: CustomFeesViewModelProps): CustomFeesViewModel {
  const { t } = useTranslation();

  const customFeeConfig = useMemo(() => {
    return sendFeatures.getCustomFeeConfig(currency);
  }, [currency]);

  // Local state for input values
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!customFeeConfig) return {};
    return customFeeConfig.getInitialValues(transaction);
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Input handlers
  const onInputChange = useCallback((key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setTouched(prev => ({ ...prev, [key]: true }));
  }, []);

  const onInputClear = useCallback((key: string) => {
    setValues(prev => ({ ...prev, [key]: "" }));
    setTouched(prev => ({ ...prev, [key]: true }));
  }, []);

  // Validation
  const hasInsufficientBalance = useMemo(() => {
    return Object.keys(status.errors).some(key => key === "insufficientBalanceFees");
  }, [status.errors]);

  const allInputsValid = useMemo(() => {
    if (!customFeeConfig) return false;
    return customFeeConfig.inputs.every(input => isValidNumber(values[input.key] ?? ""));
  }, [customFeeConfig, values]);

  // Map inputs to state
  const inputStates: CustomFeeInputState[] = useMemo(() => {
    if (!customFeeConfig) return [];

    return customFeeConfig.inputs.map((input, index) => {
      const value = values[input.key] ?? "";
      const isTouched = touched[input.key] ?? false;

      let error: string | null = null;

      // Validation error only when user entered something invalid (not for empty field)
      if (isTouched && value.trim() !== "" && !isValidNumber(value)) {
        error = t("newSendFlow.customFees.invalidValue");
      }

      // Insufficient balance error (shown only on first input, and only if other validations pass)
      if (index === 0 && allInputsValid && hasInsufficientBalance) {
        error = t("newSendFlow.insufficientBalanceFees");
      }

      const suggestedRange = input.suggestedRange?.getRange
        ? (() => {
            const range = input.suggestedRange.getRange(transaction);
            return range
              ? {
                  min: new BigNumber(range.min).toFixed(),
                  max: new BigNumber(range.max).toFixed(),
                }
              : null;
          })()
        : null;

      return {
        key: input.key,
        label: t(input.i18nLabelKey, { unit: input.unitLabel }),
        value,
        error,
        suggestedRange,
        helperLabel: input.helperInfo ? t(input.helperInfo.i18nKey) : null,
        helperValue: input.helperInfo ? input.helperInfo.getValue(transaction) : null,
      };
    });
  }, [customFeeConfig, transaction, values, touched, allInputsValid, hasInsufficientBalance, t]);

  // Fiat label and value (to be computed by bridge after confirm)
  const fiatLabel = useMemo(() => {
    if (!currency.ticker) return null;
    return t("newSendFlow.customFees.networkFeesInFiat", { currency: currency.ticker });
  }, [currency.ticker, t]);

  const fiatValue = null; // TODO: compute fiat value from status after confirm

  const isConfirmDisabled = !allInputsValid;

  const handleConfirm = useCallback(() => {
    if (!customFeeConfig || !allInputsValid) return;

    const patch = customFeeConfig.buildTransactionPatch(values);
    transactionActions.updateTransaction(tx => ({
      ...tx,
      ...patch,
    }));

    // Navigate back to Amount screen
    onConfirm();
  }, [customFeeConfig, allInputsValid, values, transactionActions, onConfirm]);

  return {
    inputs: inputStates,
    fiatLabel,
    fiatValue,
    isConfirmDisabled,
    onInputChange,
    onInputClear,
    onConfirm: handleConfirm,
  };
}
