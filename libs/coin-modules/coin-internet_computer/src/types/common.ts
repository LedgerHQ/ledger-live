import {
  AccountBridge,
  Bridge,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

type FamilyType = "internet_computer";

export function isInternetComputerTransaction(tx: TransactionCommon): tx is Transaction {
  return tx.family === "internet_computer";
}
export type Transaction = TransactionCommon & {
  family: FamilyType;
  fees: BigNumber;
  memo?: string | undefined;
};
export function isInternetComputerTransactionRaw(tx: TransactionCommonRaw): tx is TransactionRaw {
  return tx.family === "internet_computer";
}
export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  fees: string;
  memo?: string | undefined;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type InternetComputerOperation = Operation<InternetComputerOperationExtra>;

export type InternetComputerOperationExtra = {
  memo?: string | undefined;
};

export type InternetComputerAccountBridge = AccountBridge<Transaction>;
export type InternetComputerBridge = Bridge<Transaction, TransactionRaw>;
