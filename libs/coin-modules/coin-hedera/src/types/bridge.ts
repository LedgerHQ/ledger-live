import type {
  AccountBridge,
  Bridge,
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

export function isHederaTransaction(tx: TransactionCommon): tx is Transaction {
  return tx.family === "hedera";
}
export type Transaction = TransactionCommon & {
  family: "hedera";
  memo?: string | undefined;
};

export function isHederaTransactionRaw(tx: TransactionCommonRaw): tx is TransactionRaw {
  return tx.family === "hedera";
}
export type TransactionRaw = TransactionCommonRaw & {
  family: "hedera";
  memo?: string | undefined;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type HederaOperationExtra = {
  consensusTimestamp?: string;
};

export type HederaOperationExtraRaw = {
  consensusTimestamp?: string;
};

export type HederaAccountBridge = AccountBridge<Transaction>;
export type HederaBridge = Bridge<Transaction, TransactionRaw>;
