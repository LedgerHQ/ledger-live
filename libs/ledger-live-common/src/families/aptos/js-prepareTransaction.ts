import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

import { AptosAPI } from "./api";
import { getEstimatedGas } from "./js-getFeesForTransaction";
import type { Transaction } from "./types";
import { getMaxSendBalance } from "./logic";

const prepareTransaction = async (
  account: Account,
  transaction: Transaction
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
  const preparedTransaction: Transaction = {
    ...transaction,
    amount,
  };

  const aptosClient = new AptosAPI(account.currency.id);

  const { fees, estimate, errors } = await getEstimatedGas(
    account,
    transaction,
    aptosClient
  );

  const options = { ...transaction.options };
  if (transaction.firstEmulation) options.maxGasAmount = estimate.maxGasAmount;

  preparedTransaction.fees = fees;
  preparedTransaction.estimate = estimate;
  preparedTransaction.errors = errors;
  preparedTransaction.options = options;
  preparedTransaction.firstEmulation = false;
  preparedTransaction.skipEmulation = false;
  return preparedTransaction;
};

export default prepareTransaction;
