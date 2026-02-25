import type { Account, AccountBridge } from "@ledgerhq/types-live";
import type {
  Transaction as AleoTransaction,
  TransactionStatus as AleoTransactionStatus,
} from "../types";

export const getTransactionStatus: AccountBridge<
  AleoTransaction,
  Account,
  AleoTransactionStatus
>["getTransactionStatus"] = () => {
  throw new Error("getTransactionStatus is not supported");
};
