import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type NetworkInfo = {
  family: "hedera";
};

export type NetworkInfoRaw = {
  family: "hedera";
};

export type Transaction = TransactionCommon & {
  family: "hedera";
  memo?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "hedera";
  memo?: string;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const reflect = (_declare: any) => {};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
