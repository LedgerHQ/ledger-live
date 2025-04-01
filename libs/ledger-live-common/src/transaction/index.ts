export * from "@ledgerhq/coin-framework/transaction/common";
export * from "./deviceTransactionConfig";
export * from "./signOperation";
import type { Account } from "@ledgerhq/types-live";
import { getAccountBridgeByFamily } from "../bridge/impl";
import type {
  Transaction,
  TransactionRaw,
  TransactionStatus,
  TransactionStatusRaw,
} from "../generated/types";

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  return getAccountBridgeByFamily(tr.family).fromTransactionRaw(tr);
};
export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  return getAccountBridgeByFamily(t.family).toTransactionRaw(t);
};

export const fromTransactionStatusRaw = (
  tr: TransactionStatusRaw,
  family: string,
): TransactionStatus => {
  return getAccountBridgeByFamily(family).fromTransactionStatusRaw(tr as any);
};
export const toTransactionStatusRaw = (
  t: TransactionStatus,
  family: string,
): TransactionStatusRaw => {
  return getAccountBridgeByFamily(family).toTransactionStatusRaw(t as any);
};

export const formatTransaction = (t: Transaction, a: Account): string => {
  return getAccountBridgeByFamily(t.family).formatTransaction(t as any, a as any);
};

export const formatTransactionStatus = (
  t: Transaction,
  ts: TransactionStatus,
  mainAccount: Account,
): string => {
  return getAccountBridgeByFamily(t.family).formatTransactionStatus(
    t as any,
    ts as any,
    mainAccount as any,
  );
};
