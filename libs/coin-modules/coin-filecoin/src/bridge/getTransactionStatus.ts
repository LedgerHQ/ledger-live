import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAddress, getSubAccount } from "../common-logic";
import { InvalidRecipientForTokenTransfer } from "../errors";
import { isRecipientValidForTokenTransfer, validateAddress } from "../network";
import { Transaction, TransactionStatus } from "../types";
import { calculateEstimatedFees } from "./utils";

export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] = async (
  account: Account,
  transaction: Transaction,
): Promise<TransactionStatus> => {
  // log("debug", "[getTransactionStatus] start fn");
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};
  const { balance } = account;
  const { address } = getAddress(account);
  const subAccount = getSubAccount(account, transaction);
  const { recipient, useAllAmount, gasPremium, gasFeeCap, gasLimit } = transaction;
  let { amount } = transaction;
  const invalidAddressErr = new InvalidAddress(undefined, {
    currencyName: account.currency.name,
  });
  if (!recipient) errors.recipient = new RecipientRequired();
  else if (!validateAddress(recipient).isValid) errors.recipient = invalidAddressErr;
  else if (!validateAddress(address).isValid) errors.sender = invalidAddressErr;
  if (gasFeeCap.eq(0) || gasPremium.eq(0) || gasLimit.eq(0)) errors.gas = new FeeNotLoaded();
  // This is the worst case scenario (the tx won't cost more than this value)
  const estimatedFees = calculateEstimatedFees(gasFeeCap, gasLimit);
  let totalSpent: BigNumber;
  if (useAllAmount && !subAccount) {
    totalSpent = account.spendableBalance;
    amount = totalSpent.minus(estimatedFees);
    if (amount.lte(0) || totalSpent.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  if (subAccount) {
    totalSpent = estimatedFees;
    if (totalSpent.gt(account.spendableBalance)) errors.amount = new NotEnoughBalance();
  } else {
    totalSpent = amount.plus(estimatedFees);
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    } else if (totalSpent.gt(account.spendableBalance)) errors.amount = new NotEnoughBalance();
  }

  if (subAccount) {
    const spendable = subAccount.spendableBalance;
    if (transaction.amount.gt(spendable)) {
      errors.amount = new NotEnoughBalance();
    }
    if (useAllAmount) {
      amount = spendable;
    }
    totalSpent = amount;

    if (recipient && !isRecipientValidForTokenTransfer(recipient)) {
      errors.recipient = new InvalidRecipientForTokenTransfer();
    }
  }

  // log("debug", "[getTransactionStatus] finish fn");

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};
