import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import {
  NotEnoughBalance,
  NotEnoughBalanceInParentAccount,
  RecipientRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  FeeNotLoaded,
  FeeTooHigh,
  InvalidAddress,
} from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
import { isValidSuiAddress } from "@mysten/sui/utils";
import { BigNumber } from "bignumber.js";
import { ONE_SUI } from "../constants";
import {
  OneSuiMinForStake,
  OneSuiMinForUnstake,
  OneSuiMinForUnstakeToBeLeft,
  SomeSuiForUnstake,
} from "../errors";
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
  let estimatedFees = new BigNumber(transaction?.fees || 0);
  if (estimatedFees.eq(0) && transaction.mode === "delegate") {
    estimatedFees = BigNumber(ONE_SUI).div(10);
  }
  const totalSpent = transaction.subAccountId ? amount : amount.plus(estimatedFees);
  let accountBalance = account.balance;

  if (transaction.subAccountId) {
    const subAccount = findSubAccountById(account, transaction.subAccountId);
    accountBalance = subAccount?.balance ?? new BigNumber(0);
  }

  if (amount.lte(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  } else if (estimatedFees.times(10).gt(amount) && !transaction.subAccountId) {
    warnings.feeTooHigh = new FeeTooHigh();
  }

  if (!transaction.fees) {
    errors.fees = new FeeNotLoaded();
  }

  if (transaction.mode === "undelegate") {
    const stakes = account.suiResources?.stakes?.flatMap(({ stakes }) => stakes) ?? [];
    const stake = stakes.find(s => s.stakedSuiId === transaction.stakedSuiId);
    if (stake) {
      if (!transaction.useAllAmount && amount.lt(ONE_SUI)) {
        errors.amount = new OneSuiMinForUnstake();
      }
      const stakeLeft = BigNumber(stake?.principal).minus(amount);
      if (!transaction.useAllAmount && stakeLeft.lt(ONE_SUI) && stakeLeft.gt(0)) {
        errors.amount = new OneSuiMinForUnstakeToBeLeft();
      }
    }
  } else {
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

    if (totalSpent.eq(0) && transaction.useAllAmount) {
      errors.amount = new NotEnoughBalance();
    }

    if (transaction.subAccountId && estimatedFees.gt(account.balance)) {
      errors.amount = new NotEnoughBalanceInParentAccount();
    }

    if (totalSpent.gt(accountBalance)) {
      errors.amount = new NotEnoughBalance();
    }
  }
  if (transaction.mode === "delegate") {
    if (amount.lt(new BigNumber(ONE_SUI))) {
      errors.amount = new OneSuiMinForStake();
    }

    // 0.1 SUI
    if (account.balance.minus(transaction.amount).lt(ONE_SUI / 10))
      warnings.amount = new SomeSuiForUnstake();
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
