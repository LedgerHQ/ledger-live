import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import {
  AvalancheInvalidDateTimeError,
  AvalancheMinimumAmountError,
} from "./errors";
import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "./types";
import { FIVE_MINUTES, TWO_WEEKS, AVAX_MINIMUM_STAKE_AMOUNT } from "./utils";

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
  } else if (amount.lt(AVAX_MINIMUM_STAKE_AMOUNT)) {
    errors.amount = new AvalancheMinimumAmountError();
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

  const isAfterValidStakeTimeRange =
    transaction.maxEndTime && transaction.endTime?.gt(transaction.maxEndTime);

  const twoWeeksAndfiveMinutesFromNow = new BigNumber(
    Math.round(new Date().getTime() / 1000) + TWO_WEEKS + FIVE_MINUTES
  );

  const isBeforeValidStakeTimeRange =
    transaction.endTime &&
    transaction.endTime?.lt(twoWeeksAndfiveMinutesFromNow);

  if (isBeforeValidStakeTimeRange || isAfterValidStakeTimeRange) {
    errors.time = new AvalancheInvalidDateTimeError();
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
