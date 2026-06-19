import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/index";
import BigNumber from "bignumber.js";

import { getDelegationOpMaxAmount, getStakingPosition } from "../logic/staking";
import { AptosAPI } from "../network";
import type { AptosAccount, Transaction, TransactionErrors } from "../types";
import {
  APTOS_DELEGATION_RESERVE_IN_OCTAS,
  APTOS_MINIMUM_RESTAKE_IN_OCTAS,
  DEFAULT_GAS,
  DEFAULT_GAS_PRICE,
  MIN_COINS_ON_SHARES_POOL_IN_OCTAS,
} from "../constants";
import { getEstimatedGas } from "./getFeesForTransaction";
import { getMaxSendBalance } from "./logic";

type TokenAccount = ReturnType<typeof findSubAccountById>;

const DELEGATION_RESERVE_MODES = new Set<Transaction["mode"]>(["restake", "unstake", "withdraw"]);

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

const shouldSkipPreparation = (transaction: Transaction, account: AptosAccount): boolean =>
  !transaction.recipient ||
  checkSendConditions(transaction, account) ||
  checkStakeConditions(transaction, account) ||
  checkRestakeConditions(transaction, account) ||
  checkUnstakeConditions(transaction, account) ||
  checkWithdrawConditions(transaction, account);

const maxSendBalanceFor = (
  account: AptosAccount,
  tokenAccount: TokenAccount,
  gas: BigNumber,
  gasPrice: BigNumber,
): BigNumber =>
  tokenAccount
    ? getMaxSendBalance(tokenAccount, account, gas, gasPrice)
    : getMaxSendBalance(account, undefined, gas, gasPrice);

// For "use max" sends, reserve the default gas limit to avoid too-tight simulation estimates.
const applyMaxSend = (
  transaction: Transaction,
  account: AptosAccount,
  tokenAccount: TokenAccount,
  errors: TransactionErrors,
): Transaction => {
  const maxGas = BigNumber(DEFAULT_GAS);
  const maxGasPrice = BigNumber(DEFAULT_GAS_PRICE);

  transaction.amount = maxSendBalanceFor(account, tokenAccount, maxGas, maxGasPrice);
  transaction.fees = maxGas.multipliedBy(maxGasPrice);
  transaction.options = {
    maxGasAmount: maxGas.toString(),
    gasUnitPrice: maxGasPrice.toString(),
  };
  transaction.errors = errors;

  return transaction;
};

// Reserve a certain amount to cover future network fees to deactivate and withdraw
const getUseAllAmount = (
  transaction: Transaction,
  account: AptosAccount,
  maxAmount: BigNumber,
): BigNumber => {
  if (DELEGATION_RESERVE_MODES.has(transaction.mode)) {
    return getDelegationOpMaxAmount(account, transaction.recipient, transaction.mode);
  }
  if (transaction.mode === "stake") {
    const reservedAmount = maxAmount.minus(APTOS_DELEGATION_RESERVE_IN_OCTAS);
    return reservedAmount.isNegative() ? BigNumber(0) : reservedAmount;
  }
  return transaction.amount;
};

const prepareTransaction = async (
  account: AptosAccount,
  transaction: Transaction,
): Promise<Transaction> => {
  if (shouldSkipPreparation(transaction, account)) return transaction;

  // if transaction.useAllAmount is true, then we expect transaction.amount to be 0
  // so to check that actual amount is zero or not, we also need to check if useAllAmount is false
  if (!transaction.useAllAmount && transaction.amount.isZero()) {
    return {
      ...transaction,
      fees: BigNumber(0),
    };
  }

  const aptosClient = new AptosAPI(account.currency.id);
  const tokenAccount = findSubAccountById(account, transaction?.subAccountId ?? "");

  const estimationTransaction = transaction.useAllAmount
    ? { ...transaction, amount: BigNumber(0) }
    : transaction;

  try {
    const { fees, estimate, errors } = await getEstimatedGas(
      account,
      estimationTransaction,
      aptosClient,
    );

    if (transaction.useAllAmount) {
      if (transaction.mode === "send") {
        return applyMaxSend(transaction, account, tokenAccount, errors);
      }

      const gas = BigNumber(estimate.maxGasAmount);
      const gasPrice = BigNumber(estimate.gasUnitPrice);
      const maxAmount = maxSendBalanceFor(account, tokenAccount, gas, gasPrice);

      transaction.amount = getUseAllAmount(transaction, account, maxAmount);
    }

    transaction.fees = fees;
    transaction.options = estimate;
    transaction.errors = errors;
  } catch {
    return {
      ...transaction,
      fees: null,
    };
  }

  return transaction;
};

export default prepareTransaction;
