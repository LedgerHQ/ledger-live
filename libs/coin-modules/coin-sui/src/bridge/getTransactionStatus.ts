import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  NotEnoughBalanceInParentAccount,
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  FeeNotLoaded,
  FeeTooHigh,
} from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { isValidSuiAddress } from "@mysten/sui/utils";
import type { SuiAccount, Transaction, TransactionStatus } from "../types";
import { ensureAddressFormat } from "../utils";

/**
 * Get the status of a transaction.
 * @function getTransactionStatus
 * @param {SuiAccount} account - The account associated with the transaction.
 * @param {Transaction} transaction - The transaction object containing details such as amount, fees, and recipient.
 * @returns {Promise<Object>} A promise that resolves to an object containing the transaction status, including errors, warnings, estimated fees, amount, and total spent.
 */
export const getTransactionStatus: AccountBridge<
  Transaction,
  SuiAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const amount = new BigNumber(transaction?.amount || 0);
  const estimatedFees = new BigNumber(transaction?.fees || 0);
  const totalSpent = transaction.subAccountId ? amount : amount.plus(estimatedFees);
  let accountBalance = account.balance;

  if (transaction.subAccountId) {
    const subAccount = findSubAccountById(account, transaction.subAccountId);
    accountBalance = subAccount?.balance ?? new BigNumber(0);
  }

  if (amount.lte(0)) {
    errors.amount = new AmountRequired();
  } else if (estimatedFees.times(10).gt(amount) && !transaction.subAccountId) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isValidSuiAddress(transaction.recipient)) {
    errors.recipient = new InvalidAddress(undefined, {
      currencyName: account.currency.name,
    });
  }

  if (ensureAddressFormat(account.freshAddress) === ensureAddressFormat(transaction.recipient)) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (transaction.subAccountId && estimatedFees.gt(account.balance)) {
    errors.amount = new NotEnoughBalanceInParentAccount();
  }

  if (totalSpent.eq(0) && transaction.useAllAmount) {
    errors.amount = new NotEnoughBalance();
  }
  if (totalSpent.gt(accountBalance)) {
    errors.amount = new NotEnoughBalance();
  }
  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount: amount.lt(0) ? new BigNumber(0) : amount,
    totalSpent,
  };
};

export default getTransactionStatus;
