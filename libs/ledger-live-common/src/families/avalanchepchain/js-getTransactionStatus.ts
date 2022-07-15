import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalanceToDelegate,
} from "@ledgerhq/errors";
import { Account, TransactionStatus } from "../../types";
import { Transaction } from "./types";
import { isValidAddress } from "./logic";
import { AVAX_MINIMUM_STAKE_AMOUNT } from "./utils";

const getTransactionStatus = async (
  account: Account,
  transaction: Transaction
): Promise<TransactionStatus> => {
  const errors: any = {};
  const warnings: any = {};
  const useAllAmount = !!transaction.useAllAmount;

  if (account.freshAddress === transaction.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  const estimatedFees = transaction.fees || new BigNumber(0);

  const amount = useAllAmount
    ? account.spendableBalance.minus(estimatedFees)
    : new BigNumber(transaction.amount);

  if (amount.lte(0) && !transaction.useAllAmount) {
    errors.amount = new AmountRequired();
  }

  if (amount.lt(AVAX_MINIMUM_STAKE_AMOUNT)) {
    errors.amount = new NotEnoughBalanceToDelegate();
  }

  const totalSpent = amount.plus(estimatedFees);

  if (totalSpent.gt(account.spendableBalance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (!errors.amount && account.spendableBalance.lt(estimatedFees)) {
    errors.amount = new NotEnoughBalance();
  }

  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired();
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
