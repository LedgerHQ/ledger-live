import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

import { AptosAPI } from "./api";
import { getEstimatedGas } from "./js-getFeesForTransaction";
import type { Transaction } from "./types";
import { getMaxSendBalance } from "./logic";

const prepareTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<Transaction> => {
  if (!transaction.recipient) {
    return transaction;
  }

  // if transaction.useAllAmount is true, then we expect transaction.amount to be 0
  // so to check that actual amount is zero or not, we also need to check if useAllAmount is false
  if (transaction.amount.isZero() && !transaction.useAllAmount) {
    return {
      ...transaction,
      fees: BigNumber(0),
    };
  }

  const aptosClient = new AptosAPI(account.currency.id);

  const { fees, estimate, errors } = await getEstimatedGas(account, transaction, aptosClient);

  const amount = transaction.useAllAmount
    ? getMaxSendBalance(
        account.spendableBalance,
        BigNumber(estimate.maxGasAmount),
        BigNumber(estimate.gasUnitPrice),
      )
    : transaction.amount;
  transaction.amount = amount;

  if (transaction.firstEmulation) {
    transaction.options.maxGasAmount = estimate.maxGasAmount;
  }

  transaction.fees = fees;
  transaction.estimate = estimate;
  transaction.errors = errors;
  transaction.firstEmulation = false;

  return transaction;
};

export default prepareTransaction;
