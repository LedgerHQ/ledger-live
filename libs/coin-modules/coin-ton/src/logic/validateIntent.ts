import type {
  Balance,
  FeeEstimation,
  TransactionIntent,
  TransactionValidation,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/coin-module-framework/errors";
import { toNano } from "@ton/core";
import type { TonContext } from "../config";
import { MINIMUM_REQUIRED_BALANCE, TOKEN_TRANSFER_MAX_FEE } from "../constants";
import {
  TonCommentInvalid,
  TonExcessFee,
  TonMinimumRequired,
  TonNotEnoughBalanceInParentAccount,
} from "../errors";
import type { TonMemo } from "../types";
import { addressesAreEqual, isAddressValid } from "./address";
import { commentOf } from "./craftTransaction";
import { estimateFees } from "./estimateFees";
import { validateMemo } from "./validateMemo";

// `InvalidAddress` names the currency as the legacy bridge does; the coin config calls it "Gram".
const CURRENCY_NAME = "TON";

function findBalance(
  balances: Balance[],
  asset: TransactionIntent<TonMemo>["asset"],
): Balance | undefined {
  if (asset.type === "native") {
    return balances.find(balance => balance.asset.type === "native");
  }
  const master = "assetReference" in asset ? asset.assetReference : undefined;
  return balances.find(
    ({ asset: candidate }) =>
      candidate.type === asset.type &&
      "assetReference" in candidate &&
      !!master &&
      !!candidate.assetReference &&
      addressesAreEqual(candidate.assetReference, master),
  );
}

// TON locks nothing itself; the generic bridge puts what pending sends spend in `locked`.
function availableOf(balances: Balance[], asset: TransactionIntent<TonMemo>["asset"]): bigint {
  const balance = findBalance(balances, asset);
  return (balance?.value ?? 0n) - (balance?.locked ?? 0n);
}

function recipientError(sender: string, recipient: string): Error | undefined {
  if (!recipient) return new RecipientRequired();
  if (!isAddressValid(recipient)) return new InvalidAddress("", { currencyName: CURRENCY_NAME });
  if (addressesAreEqual(sender, recipient)) {
    return new InvalidAddressBecauseDestinationIsAlsoSource();
  }
  return undefined;
}

// Below the fee, a TON send-max goes negative, and the sign is kept for `amountError`.
function sendAmount(
  intent: TransactionIntent<TonMemo>,
  spendable: bigint,
  fees: bigint,
  isJetton: boolean,
): bigint {
  if (!intent.useAllAmount) return intent.amount;
  return isJetton ? spendable : spendable - fees;
}

type AmountCheck = {
  isJetton: boolean;
  amount: bigint;
  totalSpent: bigint;
  spendable: bigint;
  nativeAvailable: bigint;
};

function amountError({
  isJetton,
  amount,
  totalSpent,
  spendable,
  nativeAvailable,
}: AmountCheck): Error | undefined {
  if (isJetton && nativeAvailable < toNano(TOKEN_TRANSFER_MAX_FEE)) {
    return new TonNotEnoughBalanceInParentAccount();
  }
  if (amount === 0n) return new AmountRequired();
  if (totalSpent > spendable) return new NotEnoughBalance();
  if (!isJetton && nativeAvailable < toNano(MINIMUM_REQUIRED_BALANCE)) {
    return new TonMinimumRequired();
  }
  // A send-max below the fee; under 0.02 TON the floor answers first, as on the legacy bridge.
  return amount < 0n ? new NotEnoughBalance() : undefined;
}

export async function validateIntent(
  context: TonContext,
  intent: TransactionIntent<TonMemo>,
  balances: Balance[],
  customFees?: FeeEstimation,
): Promise<TransactionValidation> {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const isJetton = intent.asset.type !== "native";
  const nativeAvailable = availableOf(balances, { type: "native" });
  const senderIsValid = isAddressValid(intent.sender);
  // The indexer rejects an invalid sender with a 422, and a negative amount has no encoding; the
  // checks below report both.
  const priced = { ...intent, amount: intent.amount < 0n ? 0n : intent.amount };
  const fees =
    customFees?.value ?? (senderIsValid ? (await estimateFees(context, priced)).value : 0n);

  const recipientIssue = recipientError(intent.sender, intent.recipient);
  if (recipientIssue) {
    errors.recipient = recipientIssue;
  }
  if (!senderIsValid) {
    errors.sender = new InvalidAddress("", { currencyName: CURRENCY_NAME });
  }

  const spendable = isJetton ? availableOf(balances, intent.asset) : nativeAvailable;
  const amount = sendAmount(intent, spendable, fees, isJetton);
  const totalSpent = isJetton ? amount : amount + fees;

  const amountIssue = amountError({ isJetton, amount, totalSpent, spendable, nativeAvailable });
  if (amountIssue) {
    errors.amount = amountIssue;
  }
  if (isJetton) {
    warnings.amount = new TonExcessFee();
  }

  if (!validateMemo({ isEncrypted: false, text: commentOf(intent) })) {
    errors.transaction = new TonCommentInvalid();
  }

  const sent = amount < 0n ? 0n : amount;
  return {
    errors,
    warnings,
    estimatedFees: fees,
    amount: sent,
    totalSpent: isJetton ? sent : sent + fees,
  };
}
