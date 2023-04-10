import type { Account } from "@ledgerhq/types-live";

import { AptosAPI } from "./api";
import { getEstimatedGas } from "./js-getFeesForTransaction";
import type { Transaction } from "./types";

const prepareTransaction = async (
  account: Account,
  transaction: Transaction
): Promise<Transaction> => {
  let amount = transaction.amount;
  const aptosClient = new AptosAPI(account.currency.id);

  const { fees, gasLimit, gasUnitPrice } = await getEstimatedGas(
    account,
    transaction,
    aptosClient
  );

  if (transaction.useAllAmount) {
    amount = account.balance.minus(fees);
  }

  const preparedTransaction = {
    ...transaction,
    amount,
    fees,
    gasLimit,
    gasUnitPrice,
  };
  return preparedTransaction;
};

export default prepareTransaction;
