import { useMemo } from "react";
import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../../../../coin-modules/transaction-types";
import type { CustomFeeInputDescriptor } from "../../../../bridge/descriptor/types";
import {
  isValidNumberForInput,
  computeMinValue,
  getInsufficientBalanceTargetInputKey,
  hasInsufficientBalanceErrorName,
} from "../utils/customFeeUtils";

type UseCustomFeeValidationParams = Readonly<{
  account: AccountLike;
  feePayerAccount: AccountLike | null;
  transaction: Transaction;
  status: TransactionStatus;
  activeInputs: readonly CustomFeeInputDescriptor[];
  values: Record<string, string>;
  estimatedFeesForValidation: BigNumber;
  bridgeHasInsufficientBalance: boolean;
  hasCustomFeeConfig: boolean;
}>;

type UseCustomFeeValidationResult = Readonly<{
  hasMinValueViolation: boolean;
  hasMaxFeeViolation: boolean;
  hasInsufficientBalance: boolean;
  insufficientBalanceTargetInputKey: string | null;
}>;

export function useCustomFeeValidation({
  account,
  feePayerAccount,
  transaction,
  status,
  activeInputs,
  values,
  estimatedFeesForValidation,
  bridgeHasInsufficientBalance,
  hasCustomFeeConfig,
}: UseCustomFeeValidationParams): UseCustomFeeValidationResult {
  const hasMinValueViolation = useMemo(() => {
    if (!hasCustomFeeConfig) return false;
    return activeInputs.some(input => {
      const minVal = computeMinValue(input, transaction);
      if (!minVal) return false;
      const value = values[input.key] ?? "";
      if (!isValidNumberForInput(input.key, value)) return false;
      return new BigNumber(value).lt(new BigNumber(minVal));
    });
  }, [hasCustomFeeConfig, activeInputs, values, transaction]);

  // EVM EIP-1559: maxFeePerGas must be >= maxPriorityFeePerGas
  const hasMaxFeeViolation = useMemo(() => {
    const maxFeeValue = values["maxFeePerGas"];
    const maxPriorityFeeValue = values["maxPriorityFeePerGas"];

    if (!maxFeeValue || !maxPriorityFeeValue) return false;
    if (
      !isValidNumberForInput("maxFeePerGas", maxFeeValue) ||
      !isValidNumberForInput("maxPriorityFeePerGas", maxPriorityFeeValue)
    ) {
      return false;
    }

    return new BigNumber(maxFeeValue).lt(new BigNumber(maxPriorityFeeValue));
  }, [values]);

  const hasInsufficientBalance = useMemo(() => {
    const spendable =
      feePayerAccount && "spendableBalance" in feePayerAccount
        ? feePayerAccount.spendableBalance
        : undefined;
    const balance =
      feePayerAccount && "balance" in feePayerAccount ? feePayerAccount.balance : undefined;
    const availableBalance = spendable ?? balance;
    const txAmount = transaction.amount ?? new BigNumber(0);
    const amountAndFeesUseSameBalance = feePayerAccount?.id === account.id;
    const totalCost =
      transaction.useAllAmount || !amountAndFeesUseSameBalance
        ? estimatedFeesForValidation
        : txAmount.plus(estimatedFeesForValidation);
    const exceedsSpendable = availableBalance !== undefined && totalCost.gt(availableBalance);
    const fromStatus = Object.entries(status.errors ?? {}).some(
      ([key, error]) => key === "insufficientBalanceFees" || hasInsufficientBalanceErrorName(error),
    );
    return exceedsSpendable || fromStatus || bridgeHasInsufficientBalance;
  }, [
    account,
    feePayerAccount,
    transaction.amount,
    transaction.useAllAmount,
    estimatedFeesForValidation,
    status.errors,
    bridgeHasInsufficientBalance,
  ]);

  const insufficientBalanceTargetInputKey = useMemo(() => {
    if (!hasCustomFeeConfig) return null;
    return getInsufficientBalanceTargetInputKey(activeInputs);
  }, [hasCustomFeeConfig, activeInputs]);

  return {
    hasMinValueViolation,
    hasMaxFeeViolation,
    hasInsufficientBalance,
    insufficientBalanceTargetInputKey,
  };
}
