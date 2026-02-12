import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { ONE_SUI } from "../constants";
import type { SuiAccount, Transaction } from "../types";

// eslint-disable-next-line @typescript-eslint/no-loss-of-precision, no-loss-of-precision
export const MAX_AMOUNT_INPUT = 0xffffffffffffffff;

export enum AccountType {
  Account = "Account",
  TokenAccount = "TokenAccount",
}

export function getAccountUnit(account: AccountLike): {
  name: string;
  code: string;
  magnitude: number;
} {
  if (account.type === AccountType.TokenAccount) {
    return account.token.units[0];
  }

  return account.currency.units[0];
}

/**
 * Calculate the maximum amount that can be sent from the account after deducting fees.
 *
 * @param {SuiAccount} account - The account from which the amount is being sent.
 * @param {Transaction} transaction - The transaction details including fees.
 * @returns {BigNumber} - The maximum amount that can be sent, or 0 if insufficient balance.
 */
const calculateMaxSend = (account: SuiAccount, transaction: Transaction): BigNumber => {
  const amount = account.spendableBalance.minus(transaction.fees || 0);
  return amount.lt(0) ? new BigNumber(0) : amount;
};

/**
 * Calculate the maximum amount that can be delegated after deducting fees and reserving gas.
 *
 * @param {SuiAccount} account - The account from which the amount is being delegated.
 * @param {Transaction} transaction - The transaction details including fees.
 * @returns {BigNumber} - The maximum amount that can be delegated, or 0 if insufficient balance.
 */
const calculateMaxDelegate = (account: SuiAccount, transaction: Transaction): BigNumber => {
  // Reserve 0.1 SUI for future gas fees as recommended for delegation
  const gasReserve = BigNumber(ONE_SUI).div(10); // 0.1 SUI

  const amount = account.spendableBalance.minus(transaction.fees || 0).minus(gasReserve);
  return amount.lt(0) ? new BigNumber(0) : amount;
};

/**
 * Calculates the amount to be sent in a transaction based on the account's balance and transaction details.
 *
 * @param {Object} params - The parameters for the calculation.
 * @param {SuiAccount} params.account - The account from which the amount is being sent.
 * @param {Transaction} params.transaction - The transaction details including the amount and fees.
 * @returns {BigNumber} - The calculated amount that can be sent, ensuring it does not exceed the maximum allowed or fall below zero.
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
      case "token.send":
        amount =
          findSubAccountById(account, transaction.subAccountId!)?.spendableBalance ??
          new BigNumber(0);
        break;
      case "delegate":
        amount = calculateMaxDelegate(account, transaction);
        break;
      case "undelegate":
        // For undelegate, use the full staked amount (handled elsewhere)
        amount = transaction.amount;
        break;
    }
  } else if (transaction.amount.gt(MAX_AMOUNT_INPUT)) {
    return new BigNumber(MAX_AMOUNT_INPUT);
  }

  return amount.lt(0) ? new BigNumber(0) : amount;
};

export const assertUnreachable = (_: unknown): never => {
  throw new Error("unreachable assertion failed");
};
