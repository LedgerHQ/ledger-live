import type {
  Balance,
  FeeEstimation,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { TronMemo } from "../types";
import { estimateFees } from "./estimateFees";
import { validateAddress as networkValidateAddress } from "../network";

export async function validateIntent(
  intent: TransactionIntent<TronMemo>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees =
    customFees?.value !== undefined ? customFees.value : await estimateFees(intent);

  if (!intent.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (intent.sender === intent.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!(await networkValidateAddress(intent.recipient))) {
    errors.recipient = new InvalidAddress("", { currencyName: "Tron" });
  }

  const isToken = intent.asset.type !== "native";
  const nativeBalance = balances.find(b => b.asset.type === "native");
  const nativeAvailable = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);

  let amount: bigint;
  if (intent.useAllAmount) {
    if (isToken) {
      amount = balances.find(b => isSameAsset(b, intent))?.value ?? 0n;
    } else {
      amount = nativeAvailable - estimatedFees;
      if (amount < 0n) amount = 0n;
    }
  } else {
    amount = intent.amount;
  }

  if (!intent.useAllAmount && amount <= 0n) {
    errors.amount = new AmountRequired();
  } else if (isToken) {
    const tokenBalance = balances.find(b => isSameAsset(b, intent))?.value ?? 0n;
    if (amount > tokenBalance) errors.amount = new NotEnoughBalance();
    if (estimatedFees > nativeAvailable) errors.amount = new NotEnoughBalance();
  } else if (amount + estimatedFees > nativeAvailable) {
    errors.amount = new NotEnoughBalance();
  }

  const totalSpent = isToken ? amount : amount + estimatedFees;

  return { errors, warnings, estimatedFees, amount, totalSpent };
}

function isSameAsset(b: Balance, intent: TransactionIntent<TronMemo>): boolean {
  if (b.asset.type === "native" || intent.asset.type === "native") {
    return b.asset.type === intent.asset.type;
  }
  if ("assetReference" in b.asset && "assetReference" in intent.asset) {
    return b.asset.assetReference === intent.asset.assetReference;
  }
  return false;
}
