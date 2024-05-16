import { AccountBridge } from "@ledgerhq/types-live";
import { getTronAccountNetwork } from "./api";
import { Transaction } from "./types";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  const networkInfo =
    transaction.networkInfo || (await getTronAccountNetwork(account.freshAddress));
  return transaction.networkInfo === networkInfo ? transaction : { ...transaction, networkInfo };
};
