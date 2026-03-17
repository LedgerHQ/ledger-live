import {
  TransactionValidation,
  TransactionIntent,
  FeeEstimation,
  Balance,
} from "@ledgerhq/coin-framework/api/types";
import {
  AmountRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { isValidBase58Address } from "../logic";

export async function validateIntent(
  transactionIntent: TransactionIntent,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees = customFees?.value ?? 0n;
  const isTokenTransfer = transactionIntent.asset?.type !== "native";

  validateRecipient(transactionIntent, errors);
  const amount = computeAmount(transactionIntent, balances, estimatedFees, isTokenTransfer);
  validateAmount(transactionIntent, amount, balances, estimatedFees, isTokenTransfer, errors);
  checkFeeTooHigh(amount, estimatedFees, warnings);

  const totalSpent = isTokenTransfer ? amount : amount + estimatedFees;

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
}

function validateRecipient(intent: TransactionIntent, errors: Record<string, Error>): void {
  if (!intent.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (intent.sender === intent.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidBase58Address(intent.recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: intent.asset?.name ?? "Solana",
    });
  }
}

function computeAmount(
  intent: TransactionIntent,
  balances: Balance[],
  estimatedFees: bigint,
  isTokenTransfer: boolean,
): bigint {
  if (!intent.useAllAmount) {
    return intent.amount;
  }

  if (isTokenTransfer) {
    const tokenBalance = balances.find(
      b =>
        b.asset.type !== "native" &&
        "assetReference" in b.asset &&
        "assetReference" in (intent.asset ?? {}) &&
        (b.asset as { assetReference: string }).assetReference ===
          (intent.asset as { assetReference: string }).assetReference,
    );
    return tokenBalance?.value ?? 0n;
  }

  const nativeBalance = balances.find(b => b.asset.type === "native");
  const available = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);
  const maxAmount = available - estimatedFees;
  return maxAmount > 0n ? maxAmount : 0n;
}

function validateAmount(
  intent: TransactionIntent,
  amount: bigint,
  balances: Balance[],
  estimatedFees: bigint,
  isTokenTransfer: boolean,
  errors: Record<string, Error>,
): void {
  if (!intent.useAllAmount && amount <= 0n) {
    errors.amount = new AmountRequired();
    return;
  }

  if (isTokenTransfer) {
    const tokenBalance = balances.find(
      b =>
        b.asset.type !== "native" &&
        "assetReference" in b.asset &&
        "assetReference" in (intent.asset ?? {}) &&
        (b.asset as { assetReference: string }).assetReference ===
          (intent.asset as { assetReference: string }).assetReference,
    );
    if (amount > (tokenBalance?.value ?? 0n)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    const nativeBalance = balances.find(b => b.asset.type === "native");
    const available = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);
    if (amount + estimatedFees > available) {
      errors.amount = new NotEnoughBalance();
    }
  }
}

function checkFeeTooHigh(
  amount: bigint,
  estimatedFees: bigint,
  warnings: Record<string, Error>,
): void {
  if (amount > 0n && estimatedFees * 10n > amount) {
    warnings.feeTooHigh = new FeeTooHigh();
  }
}
