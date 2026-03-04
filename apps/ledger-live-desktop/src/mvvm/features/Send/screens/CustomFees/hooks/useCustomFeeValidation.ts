import { useMemo } from "react";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { CustomFeeInputDescriptor } from "@ledgerhq/live-common/bridge/descriptor";
import BigNumber from "bignumber.js";
import {
  isValidNumberForInput,
  computeMinValue,
  getInsufficientBalanceTargetInputKey,
  hasInsufficientBalanceErrorName,
} from "../utils/customFeeUtils";

type UseCustomFeeValidationParams = Readonly<{
  account: AccountLike;
  transaction: Transaction;
  status: TransactionStatus;
  activeInputs: readonly CustomFeeInputDescriptor[];
  values: Record<string, string>;
  estimatedFeesForValidation: BigNumber;
  bridgeHasInsufficientBalance: boolean;
  hasCustomFeeConfig: boolean;
}>;

type UseCustomFeeValidationResult = Readonly<{
  allInputsValid: boolean;
  hasMinValueViolation: boolean;
  hasMaxFeeViolation: boolean;
  hasInsufficientBalance: boolean;
  insufficientBalanceTargetInputKey: string | null;
}>;

export function useCustomFeeValidation({
  account,
  transaction,
  status,
  activeInputs,
  values,
  estimatedFeesForValidation,
  bridgeHasInsufficientBalance,
  hasCustomFeeConfig,
}: UseCustomFeeValidationParams): UseCustomFeeValidationResult {
  const allInputsValid = useMemo(() => {
    if (!hasCustomFeeConfig) return false;
    return activeInputs.every(input => isValidNumberForInput(input.key, values[input.key] ?? ""));
  }, [hasCustomFeeConfig, activeInputs, values]);

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
    const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
    const balance = "balance" in account ? account.balance : new BigNumber(0);
    const availableBalance = spendable ?? balance ?? new BigNumber(0);
    const txAmount = transaction.amount ?? new BigNumber(0);
    // In max mode, amount is adjusted by the bridge to fit remaining balance.
    // Local insufficient check should only fail when fees alone exceed available balance.
    const totalCost = transaction.useAllAmount ? estimatedFeesForValidation : txAmount.plus(estimatedFeesForValidation);
    const exceedsSpendable = totalCost.gt(availableBalance);
    const fromStatus = Object.entries(status.errors ?? {}).some(
      ([key, error]) => key === "insufficientBalanceFees" || hasInsufficientBalanceErrorName(error),
    );
    return exceedsSpendable || fromStatus || bridgeHasInsufficientBalance;
  }, [
    account,
    transaction.amount,
    estimatedFeesForValidation,
    status.errors,
    bridgeHasInsufficientBalance,
  ]);

  const insufficientBalanceTargetInputKey = useMemo(() => {
    if (!hasCustomFeeConfig) return null;
    return getInsufficientBalanceTargetInputKey(activeInputs);
  }, [hasCustomFeeConfig, activeInputs]);

  return {
    allInputsValid,
    hasMinValueViolation,
    hasMaxFeeViolation,
    hasInsufficientBalance,
    insufficientBalanceTargetInputKey,
  };
}
