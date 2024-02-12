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

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type HederaOperationExtra = {
  consensusTimestamp?: string;
};

export type HederaOperationExtraRaw = {
  consensusTimestamp?: string;
};
