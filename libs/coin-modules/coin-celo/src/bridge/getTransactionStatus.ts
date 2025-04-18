import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { isValidAddress } from "@celo/utils/lib/address";
import { getPendingStakingOperationAmounts, getVote } from "../logic";
import { CeloAccount, Transaction, TransactionStatus } from "../types";
import { CeloAllFundsWarning } from "../errors";
import { celoKit } from "../network/sdk";

const kit = celoKit();

// Arbitrary buffer for paying fees of next transactions. 0.05 Celo for ~100 transactions
const FEES_SAFETY_BUFFER = new BigNumber(5000000000000000);

export const getTransactionStatus: AccountBridge<
  Transaction,
  CeloAccount,
  TransactionStatus
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: Record<string, Error> = {};
  const warnings: Record<string, Error> = {};
  const useAllAmount = !!transaction.useAllAmount;

  if (account.freshAddress === transaction.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!transaction.fees || !transaction.fees.gt(0)) {
    errors.fees = new FeeNotLoaded();
  }

  const pendingOperationAmounts = getPendingStakingOperationAmounts(account);
  const lockedGold = await kit.contracts.getLockedGold();
  const nonvotingLockedGoldBalance = await lockedGold.getAccountNonvotingLockedGold(
    account.freshAddress,
  );
  // Deduct pending vote operations from the non-voting locked balance
  const totalNonVotingLockedBalance = nonvotingLockedGoldBalance.minus(
    pendingOperationAmounts.vote,
  );
  // Deduct pending lock operations from the spendable balance
  const totalSpendableBalance = account.spendableBalance.minus(pendingOperationAmounts.lock);
  const estimatedFees = transaction.fees || new BigNumber(0);

  let amount: BigNumber = new BigNumber(0);
  if (useAllAmount && (transaction.mode === "unlock" || transaction.mode === "vote")) {
    amount = totalNonVotingLockedBalance ?? new BigNumber(0);
  } else if (useAllAmount && transaction.mode === "revoke") {
    const revoke = getVote(account, transaction.recipient, transaction.index);
    if (revoke?.amount) amount = revoke.amount;
  } else if (useAllAmount) {
    amount = totalSpendableBalance.minus(estimatedFees);
  } else {
    amount = new BigNumber(transaction.amount);
  }

  if (amount.lt(0)) amount = new BigNumber(0);

  if (
    (account.celoResources?.lockedBalance.gt(0) ||
      !!account.celoResources?.pendingWithdrawals?.length) &&
    (transaction.useAllAmount || totalSpendableBalance.minus(amount).lt(FEES_SAFETY_BUFFER)) &&
    ["send", "lock"].includes(transaction.mode)
  ) {
    warnings.amount = new CeloAllFundsWarning();
  }

  if (!["register", "withdraw", "activate"].includes(transaction.mode)) {
    if (!errors.amount && amount.lte(0) && !useAllAmount) {
      errors.amount = new AmountRequired();
    }
  }

  const totalSpent = amount.plus(estimatedFees);

  if (transaction.mode === "unlock" || transaction.mode === "vote") {
    if (!errors.amount && totalNonVotingLockedBalance && amount.gt(totalNonVotingLockedBalance)) {
      errors.amount = new NotEnoughBalance();
    }
  } else if (transaction.mode === "revoke") {
    const revoke = getVote(account, transaction.recipient, transaction.index);
    if (!errors.amount && revoke?.amount && amount.gt(revoke.amount))
      errors.amount = new NotEnoughBalance();
  } else {
    if (!errors.amount && totalSpent.gt(totalSpendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  if (!errors.amount && totalSpendableBalance.lt(estimatedFees)) {
    errors.amount = new NotEnoughBalance();
  }

  if (transaction.mode === "send") {
    if (!transaction.recipient) {
      errors.recipient = new RecipientRequired();
    } else if (!isValidAddress(transaction.recipient)) {
      errors.recipient = new InvalidAddress("", {
        currencyName: account.currency.name,
      });
    }
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
