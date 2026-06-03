import type {
  Balance,
  FeeEstimation,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  FeeTooHigh,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { isRecipientValidForTokenTransfer, validateAddress } from "../network/addresses";

export async function validateIntent(
  intent: TransactionIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees = customFees?.value ?? 0n;
  const isTokenTransfer = intent.asset.type !== "native";

  // Validate recipient
  if (!intent.recipient) {
    errors.recipient = new RecipientRequired();
  } else {
    const recipientValid = validateAddress(intent.recipient);
    if (!recipientValid.isValid) {
      errors.recipient = new InvalidAddress("", { currencyName: "Filecoin" });
    } else if (isTokenTransfer && !isRecipientValidForTokenTransfer(intent.recipient)) {
      errors.recipient = new InvalidAddress("", { currencyName: "Filecoin" });
    }
  }

  // Compute effective amount
  let amount = intent.amount;

  if (isTokenTransfer) {
    // For token transfers, find the matching token balance by lowercase assetReference
    const assetRef =
      "assetReference" in intent.asset ? intent.asset.assetReference.toLowerCase() : "";
    const tokenBalance = balances.find(
      b => "assetReference" in b.asset && b.asset.assetReference.toLowerCase() === assetRef,
    );

    if (amount <= 0n) {
      errors.amount = new AmountRequired();
    } else if (amount > (tokenBalance?.value ?? 0n)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    const nativeBalance = balances.find(b => b.asset.type === "native");
    const available = nativeBalance?.value ?? 0n;

    if (intent.useAllAmount) {
      amount = available > estimatedFees ? available - estimatedFees : 0n;
    }

    if (amount <= 0n) {
      errors.amount = new AmountRequired();
    } else if (amount + estimatedFees > available) {
      errors.amount = new NotEnoughBalance();
    }

    // Fee-too-high warning: warn when fee exceeds balance (not a hard error)
    if (estimatedFees > 0n && estimatedFees > available) {
      warnings.feeTooHigh = new FeeTooHigh();
    }
  }

  const totalSpent = isTokenTransfer ? amount : amount + estimatedFees;

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
}
