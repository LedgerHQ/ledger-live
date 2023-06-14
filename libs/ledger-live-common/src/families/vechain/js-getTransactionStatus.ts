import {
  AmountRequired,
  createCustomErrorClass,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import type { TransactionStatus } from "./types";
import type { Transaction } from "./types";
import { Account } from "@ledgerhq/types-live";
import { calculateTotalSpent, calculateTransactionInfo } from "./utils/calculateTransactionInfo";
import { isValid } from "./utils/address-utils";
import BigNumber from "bignumber.js";

const NotEnoughVTHO = createCustomErrorClass("NotEnoughVTHO");

// NOTE: seems like the spendableBalance is not updated correctly:
// use balance.minus(estimatedFees) instead
const getTransactionStatus = async (
  account: Account,
  transaction: Transaction,
): Promise<TransactionStatus> => {
  const { freshAddress, currency, subAccounts } = account;
  const { body, recipient } = transaction;
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const { isTokenAccount, amount, spendableBalance } = await calculateTransactionInfo(
    account,
    transaction,
  );

  if (!body || !body.gas) {
    errors["body"] = new FeeNotLoaded();
  }

  if (!recipient) {
    errors.recipient = new RecipientRequired();
  } else if (freshAddress.toLowerCase() === recipient.toLowerCase()) {
    warnings.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValid(recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: currency.name,
    });
  }

  if (!amount.gt(0)) {
    if (!transaction.useAllAmount) errors.amount = new AmountRequired();
    else errors.amount = new NotEnoughBalance();
  } else {
    if (amount.gt(spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
    if (!isTokenAccount) {
      // vet
      const vthoBalance = subAccounts?.[0].balance;
      if (transaction.estimatedFees.gt(vthoBalance || 0)) {
        errors.amount = new NotEnoughVTHO();
      }
    }
  }

  const totalSpent = calculateTotalSpent(isTokenAccount, transaction);

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees: Object.keys(errors).length ? new BigNumber(0) : transaction.estimatedFees,
    amount: amount,
    totalSpent: Object.keys(errors).length ? new BigNumber(0) : totalSpent,
  });
};

export default getTransactionStatus;
