export * from "@ledgerhq/ledger-wallet-framework/transaction/common";
export * from "./signOperation";
export * from "./deviceTransactionConfig";
import type {
  Transaction,
  TransactionRaw,
  TransactionStatus,
  TransactionStatusRaw,
} from "../generated/types";
import { loadTransactionForFamily } from "../coin-modules/registry";
import type { Account } from "@ledgerhq/types-live";

export const fromTransactionRaw = async (tr: TransactionRaw): Promise<Transaction> => {
  const TM = await loadTransactionForFamily(tr.family);
  return TM.fromTransactionRaw(tr) as unknown as Transaction;
};
export const toTransactionRaw = async (t: Transaction): Promise<TransactionRaw> => {
  const TM = await loadTransactionForFamily(t.family);
  return TM.toTransactionRaw(t) as unknown as TransactionRaw;
};

export const fromTransactionStatusRaw = async (
  tr: TransactionStatusRaw,
  family: string,
): Promise<TransactionStatus> => {
  const TM = await loadTransactionForFamily(family);
  if (!TM.fromTransactionStatusRaw)
    throw new Error(`fromTransactionStatusRaw not implemented for family "${family}"`);
  return TM.fromTransactionStatusRaw(tr) as unknown as TransactionStatus;
};
export const toTransactionStatusRaw = async (
  t: TransactionStatus,
  family: string,
): Promise<TransactionStatusRaw> => {
  const TM = await loadTransactionForFamily(family);
  if (!TM.toTransactionStatusRaw)
    throw new Error(`toTransactionStatusRaw not implemented for family "${family}"`);
  return TM.toTransactionStatusRaw(t) as unknown as TransactionStatusRaw;
};

export const formatTransaction = async (t: Transaction, a: Account): Promise<string> => {
  const TM = await loadTransactionForFamily(t.family);
  return TM.formatTransaction ? TM.formatTransaction(t, a) : "";
};

export const formatTransactionStatus = async (
  t: Transaction,
  ts: TransactionStatus,
  mainAccount: Account,
): Promise<string> => {
  const TM = await loadTransactionForFamily(t.family);
  return TM.formatTransactionStatus?.(t, ts, mainAccount) ?? "";
};
