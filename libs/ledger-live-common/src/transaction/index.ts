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

export const fromTransactionRaw = async (tr: TransactionRaw): Promise<Transaction> => {
  const TM = await loadTransactionForFamily(tr.family);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return TM.fromTransactionRaw(tr as any) as unknown as Transaction;
};
export const toTransactionRaw = async (t: Transaction): Promise<TransactionRaw> => {
  const TM = await loadTransactionForFamily(t.family);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return TM.toTransactionRaw(t as any) as unknown as TransactionRaw;
};

export const fromTransactionStatusRaw = async (
  tr: TransactionStatusRaw,
  family: string,
): Promise<TransactionStatus> => {
  const TM = await loadTransactionForFamily(family);
  if (!TM.fromTransactionStatusRaw)
    throw new Error(`fromTransactionStatusRaw not implemented for family "${family}"`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return TM.fromTransactionStatusRaw(tr as any) as unknown as TransactionStatus;
};
export const toTransactionStatusRaw = async (
  t: TransactionStatus,
  family: string,
): Promise<TransactionStatusRaw> => {
  const TM = await loadTransactionForFamily(family);
  if (!TM.toTransactionStatusRaw)
    throw new Error(`toTransactionStatusRaw not implemented for family "${family}"`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return TM.toTransactionStatusRaw(t as any) as unknown as TransactionStatusRaw;
};

export const formatTransaction = async (t: Transaction, a: Account): Promise<string> => {
  const TM = await loadTransactionForFamily(t.family);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return TM.formatTransaction ? await TM.formatTransaction(t as any, a as any) : "";
};

export const formatTransactionStatus = async (
  t: Transaction,
  ts: TransactionStatus,
  mainAccount: Account,
): Promise<string> => {
  const TM = await loadTransactionForFamily(t.family);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return TM.formatTransactionStatus
    ? TM.formatTransactionStatus(t as any, ts as any, mainAccount as any)
    : "";
};
