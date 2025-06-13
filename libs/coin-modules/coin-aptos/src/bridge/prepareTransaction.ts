import BigNumber from "bignumber.js";

import { AptosAPI } from "../network";
import { getEstimatedGas } from "./getFeesForTransaction";
import type { AptosAccount, Transaction } from "../types";
import { getMaxSendBalance } from "./logic";
import {
  APTOS_DELEGATION_RESERVE_IN_OCTAS,
  MIN_COINS_ON_SHARES_POOL_IN_OCTAS,
} from "./../constants";
import { getDelegationOpMaxAmount } from "../logic/staking";

const prepareTransaction = async (
  account: AptosAccount,
  transaction: Transaction,
): Promise<Transaction> => {
  if (
    !transaction.recipient ||
    (transaction.mode === "send" && transaction.amount.gt(account.spendableBalance)) ||
    (transaction.mode === "stake" &&
      ((!transaction.useAllAmount &&
        (transaction.amount.gt(account.spendableBalance) ||
          transaction.amount.lt(MIN_COINS_ON_SHARES_POOL_IN_OCTAS))) ||
        (transaction.useAllAmount &&
          account.spendableBalance.lt(MIN_COINS_ON_SHARES_POOL_IN_OCTAS)))) ||
    (transaction.mode === "restake" &&
      account.aptosResources &&
      transaction.amount.gt(account.aptosResources.pendingInactiveBalance)) ||
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
      ).minus(APTOS_DELEGATION_RESERVE_IN_OCTAS);
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
