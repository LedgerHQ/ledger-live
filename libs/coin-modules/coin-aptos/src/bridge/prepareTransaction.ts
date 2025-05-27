import BigNumber from "bignumber.js";

import { AptosAPI } from "../network";
import { getEstimatedGas } from "./getFeesForTransaction";
import type { AptosAccount, Transaction } from "../types";
import { getMaxSendBalance } from "./logic";
import {
  APTOS_DELEGATION_RESERVE_IN_OCTAS,
  MIN_COINS_ON_SHARES_POOL_IN_OCTAS,
} from "./../constants";

const prepareTransaction = async (
  account: AptosAccount,
  transaction: Transaction,
): Promise<Transaction> => {
  if (
    !transaction.recipient ||
    (transaction.mode === "send" && transaction.amount.gt(account.balance)) ||
    (transaction.mode === "stake" && transaction.amount.gt(account.balance)) ||
    (transaction.mode === "stake" && transaction.amount.lt(MIN_COINS_ON_SHARES_POOL_IN_OCTAS)) ||
    (transaction.mode === "unstake" &&
      account.aptosResources &&
      transaction.amount.gt(account.aptosResources.activeBalance)) ||
    (transaction.mode === "withdraw" &&
      account.aptosResources &&
      transaction.amount.gt(account.aptosResources.inactiveBalance))
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
    }
    if (transaction.mode === "stake") {
      // Reserve a certain amount to cover future network fees to deactivate and withdraw
      transaction.amount = transaction.amount.minus(APTOS_DELEGATION_RESERVE_IN_OCTAS);
    }
  }

  const { fees, estimate, errors } = await getEstimatedGas(account, transaction, aptosClient);

  transaction.fees = fees;
  transaction.options = estimate;
  transaction.errors = errors;

  return transaction;
};

export default prepareTransaction;
