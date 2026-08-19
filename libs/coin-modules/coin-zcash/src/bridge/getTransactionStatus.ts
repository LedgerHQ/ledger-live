import { BigNumber } from "bignumber.js";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus, ZcashAccount } from "../types/bridge";
import { ZIP317_MINIMUM_FEE } from "../logic/coin-selection";
import {
  computeAmountError,
  computeRecipientError,
  isTransparentInputTransfer,
  resolveTransparentUtxos,
} from "./statusHelpers";
import { getReservedNullifiers } from "./note-reservation";
import { getSpendableIronwoodBalance } from "../logic/account/spendability";

/**
 * Transaction status for a transparent-input (Public→*) send: the recipient
 * class differs per flow (u1 for →shielded, t1/t3 for →transparent) but both
 * are covered by `computeRecipientError`.
 */
function getTransparentInputStatus(
  account: ZcashAccount,
  tx: Transaction,
  currencyName: string,
): TransactionStatus {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  const transparentBalance = resolveTransparentUtxos(account, tx).reduce(
    (sum, utxo) => sum.plus(utxo.value),
    new BigNumber(0),
  );

  const fee = tx.zcashFee ?? new BigNumber(ZIP317_MINIMUM_FEE);
  const totalSpent = tx.amount.plus(fee);

  const recipientError = computeRecipientError(tx.recipient, currencyName);
  if (recipientError) errors.recipient = recipientError;

  if (tx.amount.lte(0) && !tx.useAllAmount) {
    errors.amount = new Error("Amount must be positive");
  } else if (totalSpent.gt(transparentBalance)) {
    errors.amount = new NotEnoughBalance();
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

  const recipientError = computeRecipientError(transaction.recipient, account.currency.name);
  if (recipientError) errors.recipient = recipientError;

  const amountError = computeAmountError(transaction, totalSpent, poolBalance);
  if (amountError) errors.amount = amountError;

  return {
    errors,
    warnings,
    estimatedFees: fee,
    amount: transaction.amount,
    totalSpent,
    recipientIsReadOnly: transaction.selfTransfer === true,
  };
};
