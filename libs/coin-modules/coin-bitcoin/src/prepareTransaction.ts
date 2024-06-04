import invariant from "invariant";
import { AccountBridge } from "@ledgerhq/types-live";
import { getAccountNetworkInfo } from "./getAccountNetworkInfo";
import type { Transaction } from "./types";
import { inferFeePerByte } from "./logic";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  let networkInfo = transaction.networkInfo;

  if (!networkInfo) {
    networkInfo = await getAccountNetworkInfo(account);
    invariant(networkInfo.family === "bitcoin", "bitcoin networkInfo expected");
  }

  const feePerByte = inferFeePerByte(transaction, networkInfo);

  if (
    (transaction.networkInfo === networkInfo &&
      (feePerByte === transaction.feePerByte || feePerByte.eq(transaction.feePerByte || 0))) ||
    transaction.feesStrategy === "custom"
  ) {
    // nothing changed
    return transaction;
  }

  return {
    ...transaction,
    networkInfo,
    feePerByte,
  };
};

export default prepareTransaction;
