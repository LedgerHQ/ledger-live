import { BigNumber } from "bignumber.js";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus, ZcashAccount } from "../types/bridge";
import { ZIP317_MINIMUM_FEE } from "../logic/coin-selection";
import { ZcashAmountBelowDustThreshold, ZcashMemoTooLong } from "../types/errors";
import { ZCASH_MEMO_MAX_BYTES } from "../constants";
import {
  computeAmountError,
  computeRecipientError,
  hasShieldedKey,
  isTransparentInputTransfer,
  isTransparentOutputDust,
  resolveTransparentUtxos,
} from "./statusHelpers";
import { getReservedNullifiers } from "./note-reservation";
import { getSpendableIronwoodBalance } from "../logic/account/spendability";

const encoder = new TextEncoder();

function computeMemoError(memo: string | undefined): Error | null {
  return memo !== undefined && encoder.encode(memo).length > ZCASH_MEMO_MAX_BYTES
    ? new ZcashMemoTooLong(ZCASH_MEMO_MAX_BYTES)
    : null;
}

/**
 * Transaction status for a transparent-input (Public→*) send: the recipient
 * class differs per flow (u1 for →shielded, t1/t3 for →transparent) and both are
 * covered by `computeRecipientError` -- which also rejects a shielded recipient
 * when the account has no UFVK to build the shielded bundle with.
 */
function getTransparentInputStatus(
  account: ZcashAccount,
  tx: Transaction,
  currencyName: string,
): TransactionStatus {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const memoError = computeMemoError(tx.memo);
  if (memoError) errors.transaction = memoError;

  const transparentBalance = resolveTransparentUtxos(account, tx).reduce(
    (sum, utxo) => sum.plus(utxo.value),
    new BigNumber(0),
  );

  const fee = tx.zcashFee ?? new BigNumber(ZIP317_MINIMUM_FEE);
  const totalSpent = tx.amount.plus(fee);

  const recipientError = computeRecipientError(tx.recipient, currencyName, hasShieldedKey(account));
  if (recipientError) errors.recipient = recipientError;

  if (tx.amount.lte(0) && !tx.useAllAmount) {
    errors.amount = new Error("Amount must be positive");
  } else if (totalSpent.gt(transparentBalance)) {
    errors.amount = new NotEnoughBalance();
  } else if (tx.transferType === "transparent" && isTransparentOutputDust(tx.amount)) {
    errors.amount = new ZcashAmountBelowDustThreshold();
  }

  return {
    errors,
    warnings,
    estimatedFees: fee,
    amount: tx.amount,
    totalSpent,
    recipientIsReadOnly: tx.selfTransfer === true,
  };
}

export const getTransactionStatus: AccountBridge<
  Transaction,
  ZcashAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  if (isTransparentInputTransfer(transaction.transferType)) {
    return getTransparentInputStatus(account, transaction, account.currency.name);
  }

  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const memoError = computeMemoError(transaction.memo);
  if (memoError) errors.transaction = memoError;

  const privateInfo = account.privateInfo;
  if (!privateInfo) {
    errors.account = new Error("Shielded sync not complete");
    return {
      errors,
      warnings,
      estimatedFees: new BigNumber(0),
      amount: transaction.amount,
      totalSpent: transaction.amount,
      recipientIsReadOnly: transaction.selfTransfer === true,
    };
  }

  // Shielded sends spend the Ironwood pool, so validate the amount against the
  // mature, unreserved figure -- the same one selection draws from, so the
  // status can never accept an amount selection cannot cover.
  const poolBalance = getSpendableIronwoodBalance(account, getReservedNullifiers(account));
  const fee = transaction.zcashFee ?? new BigNumber(ZIP317_MINIMUM_FEE);
  const totalSpent = transaction.amount.plus(fee);

  const recipientError = computeRecipientError(
    transaction.recipient,
    account.currency.name,
    hasShieldedKey(account),
  );
  if (recipientError) errors.recipient = recipientError;

  const amountError = computeAmountError(transaction, totalSpent, poolBalance);
  if (amountError) {
    errors.amount = amountError;
  } else if (
    transaction.transferType === "shielded-to-transparent" &&
    isTransparentOutputDust(transaction.amount)
  ) {
    // A shielded-to-transparent (z->t) recipient is also a transparent
    // output, so it needs the same dust check as a t->t send.
    errors.amount = new ZcashAmountBelowDustThreshold();
  }

  return {
    errors,
    warnings,
    estimatedFees: fee,
    amount: transaction.amount,
    totalSpent,
    recipientIsReadOnly: transaction.selfTransfer === true,
  };
};
