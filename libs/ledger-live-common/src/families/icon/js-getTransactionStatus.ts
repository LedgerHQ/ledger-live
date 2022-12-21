import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
} from "@ledgerhq/errors";

import type { IconAccount, Transaction, TransactionStatus } from "./types";

import { isSelfTransaction, isValidAddress } from "./logic";
import { IconNotEnoughVotingPower, IconVoteRequired } from "../../errors";

const getTransactionStatus = async (
  a: IconAccount,
  t: Transaction
): Promise<TransactionStatus> => {
  const errors: any = {};
  const warnings: any = {};
  const useAllAmount = !!t.useAllAmount;
  const { votingPower, totalDelegated, unstake } = a.iconResources;

  if (!t.fees) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = t.fees || new BigNumber(0);

  if (estimatedFees.gt(a.balance)) {
    errors.amount = new NotEnoughBalance();
  }

  const totalSpent = useAllAmount
    ? a.balance
    : new BigNumber(t.amount).plus(estimatedFees);

  const amount = useAllAmount
    ? a.balance.minus(estimatedFees)
    : new BigNumber(t.amount);

  if (t.mode === 'freeze' || t.mode === 'unfreeze' || t.mode === 'send') {
    if (amount.lte(0) && !t.useAllAmount) {
      errors.amount = new AmountRequired();
    }
  }

  if (t.mode === 'send') {
    if (totalSpent.gt(a.balance)) {
      errors.amount = new NotEnoughBalance();
    }

    if (!t.recipient) {
      errors.recipient = new RecipientRequired();
    } else if (isSelfTransaction(a, t)) {
      errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
    } else if (!isValidAddress(t.recipient)) {
      errors.recipient = new InvalidAddress();
    }
  }

  if (t.mode === 'freeze') {
    if (totalSpent.gt(a.balance.plus(unstake))) {
      errors.amount = new NotEnoughBalance();
    }
  }
  if (t.mode === 'unfreeze') {
    if (t.amount.gt(a.iconResources.votingPower)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  if (t.mode === 'vote') {
    if (t.votes?.length === 0) {
      errors.vote = new IconVoteRequired();
    }
    const votesUsed = t.votes.reduce((sum, v) => sum + Number(v.value), 0);
    const totalVotes = Number(totalDelegated.toString()) + Number(votingPower.toString());
    if (votesUsed > totalVotes) {
      errors.vote = new IconNotEnoughVotingPower();
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
