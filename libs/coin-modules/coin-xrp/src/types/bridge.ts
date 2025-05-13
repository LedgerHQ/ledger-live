import type { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type NetworkInfo = {
  family: "xrp";
  serverFee: BigNumber;
  baseReserve: BigNumber;
};

export type NetworkInfoRaw = {
  family: "xrp";
  serverFee: string;
  baseReserve: string;
};

export function isXrpTransaction(tx: TransactionCommon): tx is Transaction {
  return tx.family === "xrp";
}
export type Transaction = TransactionCommon & {
  family: "xrp";
  fee: BigNumber | null | undefined;
  networkInfo: NetworkInfo | null | undefined;
  tag: number | null | undefined;
  feeCustomUnit: Unit | null | undefined;
};

export function isXrpTransactionRaw(tx: TransactionCommonRaw): tx is TransactionRaw {
  return tx.family === "xrp";
}
export type TransactionRaw = TransactionCommonRaw & {
  family: "xrp";
  fee: string | null | undefined;
  networkInfo: NetworkInfoRaw | null | undefined;
  tag: number | null | undefined;
  feeCustomUnit: Unit | null | undefined;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
