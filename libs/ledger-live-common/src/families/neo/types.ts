import type {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type NetworkInfo = {
  family: "neo";
};
export type NetworkInfoRaw = {
  family: "neo";
};
export type Transaction = TransactionCommon & {
  family: "neo";
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "neo";
};
export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type NeoAccount = Account;
export type NeoAccountRaw = AccountRaw;
