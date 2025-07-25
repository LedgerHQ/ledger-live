import BigNumber from "bignumber.js";
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
  memo?: string | undefined;
  maxFee?: BigNumber;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "hedera";
  memo?: string | undefined;
  maxFee?: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type HederaOperationExtra = {
  consensusTimestamp?: string;
  transactionId?: string;
};
