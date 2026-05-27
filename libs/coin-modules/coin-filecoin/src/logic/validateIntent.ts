import {
  AmountRequired,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import type {
  Balance,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import { InvalidRecipientForTokenTransfer } from "../errors";
import { isRecipientValidForTokenTransfer, validateAddress } from "../network/addresses";
import { estimateFees } from "./estimateFees";

export async function validateIntent(
  intent: TransactionIntent<MemoNotSupported>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const { sender, recipient, amount, asset, useAllAmount } = intent;

  const assetWithRef = asset as { assetReference?: string };
  const isTokenTransfer = asset.type !== "native" && assetWithRef.assetReference !== undefined;

  const nativeBalance = balances.find(b => b.asset.type === "native");
  const spendableNative =
    nativeBalance !== undefined ? nativeBalance.value - (nativeBalance.locked ?? 0n) : 0n;

  const tokenBalance = isTokenTransfer
    ? (balances.find(
        b =>
          b.asset.type !== "native" &&
          (b.asset as { assetReference?: string }).assetReference === assetWithRef.assetReference,
      )?.value ?? 0n)
    : 0n;

  if (!recipient) {
    errors["recipient"] = new RecipientRequired();
  } else {
    const recipientValidation = validateAddress(recipient);
    if (!recipientValidation.isValid) {
      errors["recipient"] = new InvalidAddress();
    } else if (isTokenTransfer && !isRecipientValidForTokenTransfer(recipient)) {
      errors["recipient"] = new InvalidRecipientForTokenTransfer();
    }
  }

  if (!validateAddress(sender).isValid) {
    errors["sender"] = new InvalidAddress();
  }

  let estimatedFeeValue = 0n;
  if (Object.keys(errors).length === 0) {
    try {
      const feeResult = customFees ?? (await estimateFees(intent));
      estimatedFeeValue = feeResult.value;
    } catch {
      // fee estimation failure is not a blocking error at validation stage
    }
  }

  let resolvedAmount = amount;
  let totalSpent: bigint;

  if (isTokenTransfer) {
    if (useAllAmount) {
      resolvedAmount = tokenBalance;
    }
    totalSpent = resolvedAmount;

    if (estimatedFeeValue > spendableNative) {
      errors["amount"] = new NotEnoughBalance();
    } else if (resolvedAmount > tokenBalance) {
      errors["amount"] = new NotEnoughBalance();
    }
  } else {
    if (useAllAmount) {
      resolvedAmount =
        spendableNative > estimatedFeeValue ? spendableNative - estimatedFeeValue : 0n;
      totalSpent = spendableNative;
    } else {
      totalSpent = resolvedAmount + estimatedFeeValue;
    }

    if (resolvedAmount === 0n && !useAllAmount) {
      errors["amount"] = new AmountRequired();
    } else if (totalSpent > spendableNative) {
      errors["amount"] = new NotEnoughBalance();
    }
  }

  return {
    errors,
    warnings,
    estimatedFees: estimatedFeeValue,
    amount: resolvedAmount,
    totalSpent,
  };
}
