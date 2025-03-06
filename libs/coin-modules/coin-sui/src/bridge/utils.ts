import { BigNumber } from "bignumber.js";
import { AccountLike } from "@ledgerhq/types-live";
import type { SuiAccount, Transaction } from "../types";

// eslint-disable-next-line @typescript-eslint/no-loss-of-precision
export const MAX_AMOUNT_INPUT = 0xffffffffffffffff;

export enum AccountType {
  Account = "Account",
  TokenAccount = "TokenAccount",
}

export function getAccountUnit(account: AccountLike) {
  if (account.type === AccountType.TokenAccount) {
    return account.token.units[0];
  }

  return account.currency.units[0];
}

/**
 * Returns true if account must do a first bond - false for a bond extra
 *
 * @param {Account} a
 */
export const isFirstBond = (a: SuiAccount): boolean => !!a; // TODO: implement

/**
 * Returns nonce for an account
 *
 * @param {Account} a
 */
export const getNonce = (a: SuiAccount): number => {
  const lastPendingOp = a.pendingOperations[0];
  const nonce = Math.max(
    a.suiResources?.nonce || 0,
    lastPendingOp && typeof lastPendingOp.transactionSequenceNumber === "number"
      ? lastPendingOp.transactionSequenceNumber + 1
      : 0,
  );
  return nonce;
};

/**
 * Calculate the real spendable
 *
 * @param {*} a
 * @param {*} t
 */
const calculateMaxSend = (a: SuiAccount, t: Transaction): BigNumber => {
  const amount = a.spendableBalance.minus(t.fees || 0);
  return amount.lt(0) ? new BigNumber(0) : amount;
};

/**
 * Calculates correct amount if useAllAmount
 *
 * @param {*} param
 */
export const calculateAmount = ({
  account,
  transaction,
}: {
  account: SuiAccount;
  transaction: Transaction;
}): BigNumber => {
  let amount = transaction.amount;

  if (transaction.useAllAmount) {
    switch (transaction.mode) {
      case "send":
        amount = calculateMaxSend(account, transaction);
        break;
    }
  } else if (transaction.amount.gt(MAX_AMOUNT_INPUT)) {
    return new BigNumber(MAX_AMOUNT_INPUT);
  }

  return amount.lt(0) ? new BigNumber(0) : amount;
};

export const assertUnreachable = (_: never): never => {
  throw new Error("unreachable assertion failed");
};
