import { AccountBridge } from "@ledgerhq/types-live";
import { getTronAccountNetwork } from "../network";
import { Transaction, TronAccount } from "../types";

export const prepareTransaction: AccountBridge<
  Transaction,
  TronAccount
>["prepareTransaction"] = async (account, transaction) => {
  const networkInfo =
    transaction.networkInfo || (await getTronAccountNetwork(account.freshAddress));
  return transaction.networkInfo === networkInfo ? transaction : { ...transaction, networkInfo };
};
