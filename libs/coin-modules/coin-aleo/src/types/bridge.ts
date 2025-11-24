import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type Transaction = TransactionCommon & {
  family: "aleo";
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "aleo";
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
