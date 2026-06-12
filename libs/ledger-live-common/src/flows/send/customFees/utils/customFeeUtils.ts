import { BigNumber } from "bignumber.js";
import type { Transaction } from "../../../../coin-modules/transaction-types";
import type { CustomFeeInputDescriptor } from "../../../../bridge/descriptor/types";

export function isValidNumberForInput(inputKey: string, value: string): boolean {
  if (!value.trim()) return false;

  const num = new BigNumber(value);
  if (num.isNaN() || num.isNegative()) return false;

  // EVM max priority fee can be 0.
  if (inputKey === "maxPriorityFeePerGas") {
    return num.gte(0);
  }

  return num.gt(0);
}

/**
 * Maps a custom fee input key to its translation key suffix.
 * The app layer prepends its own namespace prefix if needed.
 */
export function getCustomFeeLabelKey(inputKey: string): string {
  switch (inputKey) {
    case "maxFeePerGas":
      return "newSendFlow.customFees.maxFee";
    case "maxPriorityFeePerGas":
      return "newSendFlow.customFees.maxPriorityFee";
    case "gasPrice":
      return "newSendFlow.customFees.feesAmount";
    case "fees":
      return "newSendFlow.customFees.feesAmount";
    case "feePerByte":
      return "newSendFlow.customFees.feePerByte";
    default:
      return "newSendFlow.customFees.feePerByte";
  }
}

/**
 * Maps a custom fee input key to its helper translation key suffix, when any.
 * The app layer prepends its own namespace prefix if needed.
 */
export function getCustomFeeHelperLabelKey(inputKey: string): string | null {
  if (inputKey === "maxFeePerGas") return "newSendFlow.customFees.nextBlock";
  return null;
}

export function computeSuggestedRange(
  input: CustomFeeInputDescriptor,
  transaction: Transaction,
): { min: string; max: string } | null {
  const getRange = input.suggestedRange?.getRange;
  if (!getRange) return null;

  const range = getRange(transaction);
  if (!range) return null;

  return {
    min: new BigNumber(range.min).toFixed(),
    max: new BigNumber(range.max).toFixed(),
  };
}

export function computeMinValue(
  input: CustomFeeInputDescriptor,
  transaction: Transaction,
): string | null {
  const getValue = input.minValue?.getValue;
  if (!getValue) return null;
  return getValue(transaction) ?? null;
}

export function getInsufficientBalanceTargetInputKey(
  inputs: readonly CustomFeeInputDescriptor[],
): string | null {
  if (inputs.some(input => input.key === "maxFeePerGas")) return "maxFeePerGas";
  if (inputs.some(input => input.key === "fees")) return "fees";
  if (inputs.some(input => input.key === "feePerByte")) return "feePerByte";
  return inputs[0]?.key ?? null;
}

export function hasInsufficientBalanceErrorName(value: unknown): boolean {
  if (!value || typeof value !== "object" || !("name" in value)) return false;
  const maybeName = Reflect.get(value, "name");
  const errorName = typeof maybeName === "string" ? maybeName : "";
  return errorName.includes("Insufficient") || errorName.includes("NotEnoughBalance");
}
