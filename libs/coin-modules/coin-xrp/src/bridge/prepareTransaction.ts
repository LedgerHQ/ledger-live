import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { estimateFees } from "../logic";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  _account,
  transaction,
) => {
  const { networkInfo } = await estimateFees(transaction.networkInfo);

  const fee = transaction.fee || networkInfo.serverFee;

  if (transaction.networkInfo !== networkInfo || transaction.fee !== fee) {
    return { ...transaction, networkInfo, fee };
  }

  return transaction;
};
