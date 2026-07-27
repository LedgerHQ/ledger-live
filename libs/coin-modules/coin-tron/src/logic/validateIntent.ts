import type {
  AssetInfo,
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
  NotEnoughGas,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { TronMemo } from "../types";
import { estimateFees } from "./estimateFees";
import { validateAddress } from "./validateAddress";

export async function validateIntent(
  intent: TransactionIntent<TronMemo>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const estimatedFees =
    typeof customFees?.value === "bigint" ? customFees.value : await estimateFees(intent);

  if (!intent.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (intent.sender === intent.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!(await validateAddress(intent.recipient, {}))) {
    errors.recipient = new InvalidAddress("", { currencyName: "Tron" });
  }

  const isToken = intent.asset.type !== "native";
  const nativeBalance = balances.find(b => b.asset.type === "native");
  const nativeAvailable = (nativeBalance?.value ?? 0n) - (nativeBalance?.locked ?? 0n);

  const spendable = isToken
    ? findAssetBalance(intent.asset, balances)
    : nativeAvailable > estimatedFees
      ? nativeAvailable - estimatedFees
      : 0n;

  const amount = intent.useAllAmount ? spendable : intent.amount;

  if (amount <= 0n) {
    // A resolved send-max of 0 means the balance is fully consumed by fees/locks.
    errors.amount = intent.useAllAmount ? new NotEnoughBalance() : new AmountRequired();
  } else if (amount > spendable) {
    errors.amount = new NotEnoughBalance();
  }

  if (nativeAvailable < estimatedFees) {
    errors.gasLimit = new NotEnoughGas(undefined, { fees: estimatedFees.toString() });
  }

  const totalSpent = isToken ? amount : amount + estimatedFees;

  return { errors, warnings, estimatedFees, amount, totalSpent };
}

// Token-only lookup (native spendable is derived from `nativeAvailable` above).
// Match on asset type first so a TRC10 balance can never satisfy a TRC20 intent
// even if their references collide, and subtract `locked` to stay consistent with
// the native spendable computation.
function findAssetBalance(asset: AssetInfo, balances: Balance[]): bigint {
  if (!("assetReference" in asset)) return 0n;
  const match = balances.find(
    b =>
      b.asset.type === asset.type &&
      "assetReference" in b.asset &&
      b.asset.assetReference === asset.assetReference,
  );
  const available = (match?.value ?? 0n) - (match?.locked ?? 0n);
  return available > 0n ? available : 0n;
}
