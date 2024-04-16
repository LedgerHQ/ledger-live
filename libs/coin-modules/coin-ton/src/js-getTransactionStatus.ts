import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { TonCommentInvalid } from "./errors";
import type { Transaction, TransactionStatus } from "./types";
import { addressesAreEqual, commentIsValid, getAddress, getSubAccount, isAddressValid } from "./utils";

const getTransactionStatus = async (a: Account, t: Transaction): Promise<TransactionStatus> => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance, spendableBalance } = a;
  const { address } = getAddress(a);
  const { recipient, useAllAmount } = t;
  let { amount } = t;

  if (!recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!isAddressValid(recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  } else if (addressesAreEqual(address, recipient)) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!isAddressValid(address)) {
    errors.sender = new InvalidAddress("", {
      currencyName: a.currency.name,
    });
  }

  const estimatedFees = t.fees;

  let totalSpent = BigNumber(0);

  if (useAllAmount) {
    totalSpent = spendableBalance;
    amount = totalSpent.minus(estimatedFees);
    if (amount.lte(0) || totalSpent.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    totalSpent = amount.plus(estimatedFees);
    if (totalSpent.gt(spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    }
  }

  const subAccount = getSubAccount(t, a);
  if (subAccount) {
    const spendable = subAccount.spendableBalance;
    if (t.amount.gt(spendable)) {
      errors.amount = new NotEnoughBalance();
    }
    if (useAllAmount) {
      amount = spendable;
    }
    totalSpent = amount;
  }

  if (t.comment.isEncrypted || !commentIsValid(t.comment)) {
    errors.comment = new TonCommentInvalid();
  }

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};

export default getTransactionStatus;
