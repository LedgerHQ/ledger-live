import type {
  Balance,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { parseAddress } from "../common-logic";
import { NotEnoughVTHO } from "../errors";

function isTokenAsset(intent: TransactionIntent): boolean {
  return intent.asset.type !== "native";
}

function spendable(balances: Balance[], isToken: boolean): bigint {
  const asset = balances.find(b =>
    isToken ? b.asset.type !== "native" : b.asset.type === "native",
  );
  return (asset?.value ?? 0n) - (asset?.locked ?? 0n);
}

function amountError(
  intent: TransactionIntent<MemoNotSupported>,
  isToken: boolean,
  amount: bigint,
  maxAmount: bigint,
  estimatedFees: bigint,
  availableAsset: bigint,
): Error | undefined {
  if (intent.useAllAmount && maxAmount === 0n) {
    return new NotEnoughBalance();
  }
  if (!intent.useAllAmount && amount <= 0n) {
    return new AmountRequired();
  }
  if (isToken && amount + estimatedFees > availableAsset) {
    return new NotEnoughBalance();
  }
  if (!isToken && amount > availableAsset) {
    return new NotEnoughBalance();
  }
  return undefined;
}

// Validate recipient, a positive amount, and enough balance incl. the VTHO gas fee (always VTHO).
export async function validateIntent(
  intent: TransactionIntent<MemoNotSupported>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const isToken = isTokenAsset(intent);
  const estimatedFees = customFees?.value ?? 0n;
  const availableAsset = spendable(balances, isToken);
  const availableVtho = spendable(balances, true);

  if (!intent.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (intent.sender.toLowerCase() === intent.recipient.toLowerCase()) {
    warnings.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!parseAddress(intent.recipient)) {
    errors.recipient = new InvalidAddress("", { currencyName: "VeChain" });
  }

  const spendableForAmount = isToken ? availableAsset - estimatedFees : availableAsset;
  const maxAmount = spendableForAmount > 0n ? spendableForAmount : 0n;
  const amount = intent.useAllAmount ? maxAmount : intent.amount;

  const amountErr = amountError(intent, isToken, amount, maxAmount, estimatedFees, availableAsset);
  if (amountErr) {
    errors.amount = amountErr;
  }

  if (!errors.amount && estimatedFees > availableVtho) {
    errors.amount = new NotEnoughVTHO();
  }

  const totalSpent = isToken ? amount + estimatedFees : amount;

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
}
