import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  FeeTooHigh,
} from "@ledgerhq/errors";
import { DECIMALS_LIMIT } from "./constants";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "./types";
import {
  isValidAddress,
  isSelfTransaction,
  computeTransactionValue,
} from "./logic";

const getTransactionStatus = async (
  a: Account,
  t: Transaction
): Promise<TransactionStatus> => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};

  if (!t.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (isSelfTransaction(a, t)) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } else if (!isValidAddress(t.recipient)) {
    errors.recipient = new InvalidAddress();
  }

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const tokenAccount =
    (t.subAccountId &&
      a.subAccounts &&
      a.subAccounts.find((ta) => ta.id === t.subAccountId)) ||
    null;

  const { amount, totalSpent, estimatedFees } = await computeTransactionValue(
    t,
    a,
    tokenAccount
  );
  if (estimatedFees.gt(a.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (tokenAccount) {
    if (totalSpent.gt(tokenAccount.balance)) {
      errors.amount = new NotEnoughBalance();
    }
    if (!totalSpent.decimalPlaces(DECIMALS_LIMIT).isEqualTo(totalSpent)) {
      errors.amount = new Error(`Maximum '${DECIMALS_LIMIT}' decimals allowed`);
    }
  } else {
    if (totalSpent.gt(a.balance)) {
      errors.amount = new NotEnoughBalance();
    }

    if (amount.div(10).lt(estimatedFees)) {
      warnings.feeTooHigh = new FeeTooHigh();
    }
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

export default getTransactionStatus;
