import {
  AccountBridge,
  Bridge,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

type FamilyType = "filecoin";

export type NetworkInfo = {
  family: FamilyType;
};
export type NetworkInfoRaw = {
  family: FamilyType;
};

export function isFilecoinTransaction(tx: TransactionCommon): tx is Transaction {
  return tx.family === "filecoin";
}
export type Transaction = TransactionCommon & {
  family: FamilyType;
  nonce: number;
  data?: Buffer;
  method: number;
  version: number;
  params?: string | undefined;
  gasLimit: BigNumber;
  gasFeeCap: BigNumber;
  gasPremium: BigNumber;
};
export function isFilecoinTransactionRaw(tx: TransactionCommonRaw): tx is TransactionRaw {
  return tx.family === "filecoin";
}
export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  version: number;
  nonce: number;
  data?: string;
  method: number;
  gasLimit: number;
  gasFeeCap: string;
  gasPremium: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type FilecoinAccountBridge = AccountBridge<Transaction>;
export type FilecoinBridge = Bridge<Transaction, TransactionRaw>;
