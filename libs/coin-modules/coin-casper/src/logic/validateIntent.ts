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
} from "@ledgerhq/ledger-wallet-framework/errors";
import invariant from "invariant";
import {
  CASPER_MAX_TRANSFER_ID,
  CASPER_MINIMUM_VALID_AMOUNT_MOTES,
  InvalidMinimumAmountError,
  MayBlockAccountError,
} from "../constants";
import { CasperInvalidTransferId } from "../errors";
import type { CasperMemo } from "../types";
import { isAddressValid } from "./validateAddress";
import { validateMemo } from "./validateMemo";

const MIN_VALID_AMOUNT_MOTES = BigInt(CASPER_MINIMUM_VALID_AMOUNT_MOTES);

export function validateIntent(
  intent: TransactionIntent<CasperMemo>,
  balances: Balance[],
  customFees?: FeeEstimation,
): TransactionValidation {
  invariant(intent.intentType !== "staking", "casper: staking is not supported");
  invariant(
    intent.asset.type === "native",
    "casper: asset type %s is not supported",
    intent.asset.type,
  );

  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const { sender, recipient, useAllAmount } = intent;
  const currencyName = intent.asset.name ?? "Casper";

  const nativeBalance = balances.find(b => b.asset.type === "native");
  const balance = nativeBalance?.value ?? 0n;
  const spendableBalance = balance - (nativeBalance?.locked ?? 0n);

  const memo = "memo" in intent ? intent.memo : undefined;
  const transferId = memo?.type === "string" && memo.kind === "transferId" ? memo.value : undefined;

  if (!recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isAddressValid(recipient)) {
    errors.recipient = new InvalidAddress("", { currencyName });
  } else if (recipient.toLowerCase() === sender.toLowerCase()) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!isAddressValid(sender)) {
    errors.sender = new InvalidAddress("", { currencyName });
  } else if (!validateMemo(transferId)) {
    errors.sender = new CasperInvalidTransferId("", { maxTransferId: CASPER_MAX_TRANSFER_ID });
    errors.transaction = new CasperInvalidTransferId("", { maxTransferId: CASPER_MAX_TRANSFER_ID });
  }

  const estimatedFees = customFees?.value ?? 0n;

  let amount = intent.amount;
  let totalSpent: bigint;

  if (useAllAmount) {
    totalSpent = spendableBalance;
    amount = totalSpent - estimatedFees;
    if (amount <= 0n || totalSpent > balance) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    totalSpent = amount + estimatedFees;
    if (amount === 0n) {
      errors.amount = new AmountRequired();
    }
    if (totalSpent > spendableBalance) {
      errors.amount = new NotEnoughBalance();
    }
  }

  if (amount < MIN_VALID_AMOUNT_MOTES && !errors.amount) {
    errors.amount = InvalidMinimumAmountError;
  }

  // `totalSpent` already includes the fees, so subtracting `estimatedFees` again counts them
  // twice. Kept on purpose: this reproduces bridge/getTransactionStatus, and the parity tests
  // pin it. Changing the threshold is a product decision, not a refactor.
  if (spendableBalance - totalSpent - estimatedFees < MIN_VALID_AMOUNT_MOTES) {
    warnings.amount = MayBlockAccountError;
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
}
