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

function validateRecipient(
  intent: TransactionIntent,
  isTokenTransfer: boolean,
  errors: Record<string, Error>,
): void {
  if (!intent.recipient) {
    errors.recipient = new RecipientRequired();
    return;
  }

  const recipientValid = validateAddress(intent.recipient);
  if (
    !recipientValid.isValid ||
    (isTokenTransfer && !isRecipientValidForTokenTransfer(intent.recipient))
  ) {
    errors.recipient = new InvalidAddress("", { currencyName: "Filecoin" });
  }
}

function validateTokenAmount(
  intent: TransactionIntent,
  balances: Balance[],
  estimatedFees: bigint,
  errors: Record<string, Error>,
): bigint {
  // Find the matching token balance by lowercase assetReference
  const assetRef =
    "assetReference" in intent.asset ? intent.asset.assetReference.toLowerCase() : "";
  const tokenBalance = balances.find(
    b => "assetReference" in b.asset && b.asset.assetReference.toLowerCase() === assetRef,
  );

  if (intent.amount <= 0n) {
    errors.amount = new AmountRequired();
  } else if (intent.amount > (tokenBalance?.value ?? 0n)) {
    errors.amount = new NotEnoughBalance();
  }

  // Token transfers still require native FIL to cover gas fees
  const nativeBal = balances.find(b => b.asset.type === "native");
  const nativeAvailable = nativeBal?.value ?? 0n;
  if (estimatedFees > 0n && estimatedFees > nativeAvailable) {
    errors.amount = new NotEnoughBalance();
  }

  return intent.amount;
}

function validateNativeAmount(
  intent: TransactionIntent,
  balances: Balance[],
  estimatedFees: bigint,
  errors: Record<string, Error>,
  warnings: Record<string, Error>,
): bigint {
  const nativeBalance = balances.find(b => b.asset.type === "native");
  const available = nativeBalance?.value ?? 0n;

  let amount = intent.amount;
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

  return amount;
}

export async function validateIntent(
  intent: TransactionIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees = customFees?.value ?? 0n;
  const isTokenTransfer = intent.asset.type !== "native";

  validateRecipient(intent, isTokenTransfer, errors);

  const amount = isTokenTransfer
    ? validateTokenAmount(intent, balances, estimatedFees, errors)
    : validateNativeAmount(intent, balances, estimatedFees, errors, warnings);

  const totalSpent = isTokenTransfer ? amount : amount + estimatedFees;

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
}
