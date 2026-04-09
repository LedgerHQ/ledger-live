export * from "@ledgerhq/ledger-wallet-framework/transaction/common";
export * from "./signOperation";
export * from "./deviceTransactionConfig";
import type {
  Transaction,
  TransactionRaw,
  TransactionStatus,
  TransactionStatusRaw,
} from "../coin-modules/transaction-types";
import { loadTransactionForFamily } from "../coin-modules/registry";
import type { Account } from "@ledgerhq/types-live";

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const TM = loadTransactionForFamily(tr.family);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return TM.fromTransactionRaw(tr as any) as unknown as Transaction;
};
export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const TM = loadTransactionForFamily(t.family);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return TM.toTransactionRaw(t as any) as unknown as TransactionRaw;
};

export const fromTransactionStatusRaw = (
  tr: TransactionStatusRaw,
  family: string,
): TransactionStatus => {
  const TM = loadTransactionForFamily(family);
  if (!TM.fromTransactionStatusRaw)
    throw new Error(`fromTransactionStatusRaw not implemented for family "${family}"`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return TM.fromTransactionStatusRaw(tr as any) as unknown as TransactionStatus;
};
export const toTransactionStatusRaw = (
  t: TransactionStatus,
  family: string,
): TransactionStatusRaw => {
  const TM = loadTransactionForFamily(family);
  if (!TM.toTransactionStatusRaw)
    throw new Error(`toTransactionStatusRaw not implemented for family "${family}"`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return TM.toTransactionStatusRaw(t as any) as unknown as TransactionStatusRaw;
};

export const formatTransaction = async (t: Transaction, a: Account): Promise<string> => {
  const TM = loadTransactionForFamily(t.family);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return TM.formatTransaction ? await TM.formatTransaction(t as any, a as any) : "";
};

export const formatTransactionStatus = (
  t: Transaction,
  ts: TransactionStatus,
  mainAccount: Account,
): string => {
  const TM = loadTransactionForFamily(t.family);
  return TM.formatTransactionStatus ? TM.formatTransactionStatus(t, ts, mainAccount) : "";
};
