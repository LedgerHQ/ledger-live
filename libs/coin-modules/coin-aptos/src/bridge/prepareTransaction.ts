import BigNumber from "bignumber.js";

import { AptosAPI } from "../network";
import { getEstimatedGas } from "./getFeesForTransaction";
import type { AptosAccount, Transaction } from "../types";
import { getMaxSendBalance } from "./logic";
import {
  APTOS_DELEGATION_RESERVE_IN_OCTAS,
  APTOS_MINIMUM_RESTAKE_IN_OCTAS,
  MIN_COINS_ON_SHARES_POOL_IN_OCTAS,
} from "./../constants";
import { getDelegationOpMaxAmount, getStakingPosition } from "../logic/staking";

const checkSendConditions = (transaction: Transaction, account: AptosAccount) =>
  transaction.mode === "send" && transaction.amount.gt(account.spendableBalance);

const checkStakeConditions = (transaction: Transaction, account: AptosAccount) => {
  const txAmount = transaction.useAllAmount ? account.spendableBalance : transaction.amount;
  const stakingPosition = account.aptosResources?.stakingPositions
    ?.find(stakingPosition => stakingPosition.validatorId === transaction.recipient)
    ?.active.gt(MIN_COINS_ON_SHARES_POOL_IN_OCTAS);
  const minimumToStake = stakingPosition
    ? APTOS_MINIMUM_RESTAKE_IN_OCTAS
    : MIN_COINS_ON_SHARES_POOL_IN_OCTAS;

  return (
    transaction.mode === "stake" &&
    (txAmount.gt(account.spendableBalance) || txAmount.lt(minimumToStake))
  );
};

const checkRestakeConditions = (transaction: Transaction, account: AptosAccount) => {
  const stakingPosition = getStakingPosition(account, transaction.recipient)?.pendingInactive || 0;

  return transaction.mode === "restake" && transaction.amount.gt(stakingPosition);
};

const checkUnstakeConditions = (transaction: Transaction, account: AptosAccount) => {
  const stakingPosition = getStakingPosition(account, transaction.recipient)?.active || 0;

  return transaction.mode === "unstake" && transaction.amount.gt(stakingPosition);
};

const checkWithdrawConditions = (transaction: Transaction, account: AptosAccount) => {
  const stakingPosition = getStakingPosition(account, transaction.recipient)?.inactive || 0;

  return transaction.mode === "withdraw" && transaction.amount.gt(stakingPosition);
};

const prepareTransaction = async (
  account: AptosAccount,
  transaction: Transaction,
): Promise<Transaction> => {
  if (
    !transaction.recipient ||
    checkSendConditions(transaction, account) ||
    checkStakeConditions(transaction, account) ||
    checkRestakeConditions(transaction, account) ||
    checkUnstakeConditions(transaction, account) ||
    checkWithdrawConditions(transaction, account)
  )
    return transaction;

  // if transaction.useAllAmount is true, then we expect transaction.amount to be 0
  // so to check that actual amount is zero or not, we also need to check if useAllAmount is false
  if (!transaction.useAllAmount && transaction.amount.isZero()) {
    return {
      ...transaction,
      fees: BigNumber(0),
    };
  }

  const aptosClient = new AptosAPI(account.currency.id);

  if (transaction.useAllAmount) {
    if (transaction.mode === "send") {
      transaction.amount = getMaxSendBalance(account, transaction);
    } else if (
      transaction.mode === "restake" ||
      transaction.mode === "unstake" ||
      transaction.mode === "withdraw"
    ) {
      // Reserve a certain amount to cover future network fees to deactivate and withdraw
      transaction.amount = getDelegationOpMaxAmount(
        account,
        transaction.recipient,
        transaction.mode,
      );
    } else if (transaction.mode === "stake") {
      // Reserve a certain amount to cover future network fees to deactivate and withdraw
      transaction.amount = getMaxSendBalance(account, transaction).minus(
        APTOS_DELEGATION_RESERVE_IN_OCTAS,
      );
    }
  }

  const { fees, estimate, errors } = await getEstimatedGas(account, transaction, aptosClient);

  transaction.fees = fees;
  transaction.options = estimate;
  transaction.errors = errors;

  return transaction;
};

export default prepareTransaction;
