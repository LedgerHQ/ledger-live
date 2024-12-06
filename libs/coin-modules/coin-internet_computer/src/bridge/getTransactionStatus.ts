import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { getAddress, validateAddress, validateMemo } from "./bridgeHelpers/addresses";
import { Transaction, TransactionStatus } from "../types";
import { InvalidMemoICP } from "../errors";

export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] = async (
  account,
  transaction,
) => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance } = account;
  const { address } = getAddress(account);
  const { recipient, useAllAmount } = transaction;
  let { amount } = transaction;

  if (!recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!(await validateAddress(recipient)).isValid) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  } else if (recipient.toLowerCase() === address.toLowerCase()) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!(await validateAddress(address)).isValid) {
    errors.sender = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  if (!validateMemo(transaction.memo).isValid) {
    errors.transaction = new InvalidMemoICP();
  }

  // This is the worst case scenario (the tx won't cost more than this value)
  const estimatedFees = transaction.fees;

  let totalSpent: BigNumber;

  if (useAllAmount) {
    totalSpent = account.spendableBalance;
    amount = totalSpent.minus(estimatedFees);
    if (amount.lte(0) || totalSpent.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    totalSpent = amount.plus(estimatedFees);
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    } else if (totalSpent.gt(account.spendableBalance)) {
      errors.amount = new NotEnoughBalance();
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
