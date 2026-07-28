import type {
  Balance,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  DustLimit,
  FeeTooHigh,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { isValidKaspaAddress } from "./kaspaAddresses";

// Fees are flagged "too high" once they exceed 1/RATIO of the sent amount (i.e. 10%),
// matching coin-cardano's threshold.
const FEE_TOO_HIGH_RATIO = 10n;

// KIP-9 storage mass makes outputs below 0.2 KAS economically unspendable: the storage
// mass penalty exceeds the value of the UTXO itself. Matches the threshold in the legacy
// bridge's getTransactionStatus.ts so both strategies surface the same error to the UI.
const DUST_LIMIT = 20_000_000n; // sompi (0.2 KAS)

function spendableNative(balances: Balance[]): bigint {
  const native = balances.find(b => b.asset.type === "native");
  return (native?.value ?? 0n) - (native?.locked ?? 0n);
}

/**
 * Validate a native KAS send intent: recipient well-formedness, a positive amount, sufficient
 * balance to cover amount + fees, and a fee-too-high warning. Fees come from the framework via
 * `customFees` (it calls `estimateFees` first); the 0n fallback is display-only.
 */
export async function validateIntent(
  intent: TransactionIntent<MemoNotSupported>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees = customFees?.value ?? 0n;
  const available = spendableNative(balances);

  if (!intent.recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (!isValidKaspaAddress(intent.recipient)) {
    errors.recipient = new InvalidAddress("", { currencyName: "Kaspa" });
  }

  const spendableForAmount = available - estimatedFees;
  const maxAmount = spendableForAmount > 0n ? spendableForAmount : 0n;
  const amount = intent.useAllAmount ? maxAmount : intent.amount;

  if (!intent.useAllAmount && amount <= 0n) {
    errors.amount = new AmountRequired();
  } else if (!intent.useAllAmount && amount < DUST_LIMIT) {
    errors.amount = new DustLimit("");
  } else if (amount + estimatedFees > available) {
    errors.amount = new NotEnoughBalance();
  }

  if (amount > 0n && estimatedFees * FEE_TOO_HIGH_RATIO > amount) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent: amount + estimatedFees,
  };
}
