export * from "@ledgerhq/coin-framework/transaction/common";
export * from "./signOperation";
export * from "./deviceTransactionConfig";
import type {
  Transaction,
  TransactionRaw,
  TransactionStatus,
  TransactionStatusRaw,
} from "../generated/types";
import transactionModulePerFamily from "../generated/transaction";
import type { Account } from "@ledgerhq/types-live";

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const TM = transactionModulePerFamily[tr.family];
  // FIXME: something is wrong with TM.fromTransactionRaw expecting a (arg: never) => for some reasons
  return TM.fromTransactionRaw(tr as any);
};
export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const TM = transactionModulePerFamily[t.family];
  // FIXME: something is wrong with TM.toTransactionRaw expecting a (arg: never) => for some reasons
  return TM.toTransactionRaw(t as any);
};

export const fromTransactionStatusRaw = (
  tr: TransactionStatusRaw,
  family: string
): TransactionStatus => {
  const TM = transactionModulePerFamily[family];
  return TM.fromTransactionStatusRaw(tr as any);
};
export const toTransactionStatusRaw = (
  t: TransactionStatus,
  family: string
): TransactionStatusRaw => {
  const TM = transactionModulePerFamily[family];
  return TM.toTransactionStatusRaw(t as any);
};

export const formatTransaction = (t: Transaction, a: Account): string => {
  const TM = transactionModulePerFamily[t.family];
  // FIXME: something is wrong with TM.formatTransaction expecting a (arg: never) => for some reasons
  return TM.formatTransaction ? TM.formatTransaction(t as any, a as any) : "";
};

export const formatTransactionStatus = (
  t: Transaction,
  ts: TransactionStatus,
  mainAccount: Account
): string => {
  const TM = transactionModulePerFamily[t.family];
  return TM.formatTransactionStatus(t as any, ts as any, mainAccount as any);
};
