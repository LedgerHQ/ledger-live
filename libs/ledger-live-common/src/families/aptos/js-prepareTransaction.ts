import BigNumber from "bignumber.js";

import { AptosAPI } from "./api";
import { getEstimatedGas } from "./js-getFeesForTransaction";
import type { Transaction, AptosAccount as Account } from "./types";
import { getMaxSendBalance } from "./logic";

const prepareTransaction = async (
  account: Account,
  transaction: Transaction,
): Promise<Transaction> => {
  if (transaction.amount.isZero() && !transaction.useAllAmount) {
    return {
      ...transaction,
      fees: BigNumber(0),
    };
  }

  const amount = transaction.useAllAmount
    ? getMaxSendBalance(account.spendableBalance)
    : BigNumber(transaction.amount);
  transaction.amount = amount;

  const aptosClient = new AptosAPI(account.currency.id);

  const { fees, estimate, errors } = await getEstimatedGas(account, transaction, aptosClient);

  if (transaction.firstEmulation) {
    transaction.options.maxGasAmount = estimate.maxGasAmount;
  }

  transaction.fees = fees;
  transaction.estimate = estimate;
  transaction.errors = errors;
  transaction.firstEmulation = false;
  transaction.skipEmulation = false;

  return transaction;
};

export default prepareTransaction;
