import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalanceToDelegate,
} from "@ledgerhq/errors";
import { AvalancheInvalidDateTimeError } from "./errors";
import { Account, TransactionStatus } from "../../types";
import { Transaction } from "./types";
import { AVAX_MINIMUM_STAKE_AMOUNT } from "./utils";
import { FIFTEEN_MINUTES, TWO_WEEKS } from "./utils";

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

  const isBeyondValidStakeTimeRange =
    transaction.maxEndTime && transaction.endTime?.gt(transaction.maxEndTime);

  const twoWeeksAndfifteenMinutesFromNow = new BigNumber(
    Math.round(new Date().getTime() / 1000) + FIFTEEN_MINUTES + TWO_WEEKS
  );

  const isUnderValidStakeTimeRange =
    transaction.endTime &&
    transaction.endTime?.lt(twoWeeksAndfifteenMinutesFromNow);

  if (isBeyondValidStakeTimeRange || isUnderValidStakeTimeRange) {
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
