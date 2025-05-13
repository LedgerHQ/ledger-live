export * from "@ledgerhq/coin-framework/transaction/common";
export * from "./deviceTransactionConfig";
export * from "./signOperation";
import type { Account } from "@ledgerhq/types-live";
import { callSerializeBridgeFunc, getBridgeByFamily, getBridgeByTransaction } from "../bridge/impl";
import type {
  Transaction,
  TransactionRaw,
  TransactionStatus,
  TransactionStatusRaw,
} from "../generated/types";

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  // const bridge = getBridgeByTransaction(tr);
  // return bridge.serializationBridge.fromTransactionRaw(tr);
  return callSerializeBridgeFunc(tr, "fromTransactionRaw");
};
export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  // const bridge = getBridgeByTransaction(t);
  // return bridge.serializationBridge.toTransactionRaw(t);
  return callSerializeBridgeFunc(t, "toTransactionRaw");
};

export const fromTransactionStatusRaw = (
  tr: TransactionStatusRaw,
  family: string,
): TransactionStatus => {
  // const bridge = getBridgeByFamily(family);
  // return bridge.serializationBridge.fromTransactionStatusRaw(tr);
  return callSerializeBridgeFunc(t, "toTransactionRaw");
};
export const toTransactionStatusRaw = (
  t: TransactionStatus,
  family: string,
): TransactionStatusRaw => {
  // const bridge = getBridgeByFamily(family);
  // return bridge.serializationBridge.toTransactionStatusRaw(t);
  return callSerializeBridgeFunc(t, "toTransactionRaw");
};

export const formatTransaction = (t: Transaction, a: Account): string => {
  // const bridge = getBridgeByTransaction(t);
  // return bridge.serializationBridge.formatTransaction(t, a);
  return callSerializeBridgeFunc(t, "toTransactionRaw");
};

export const formatTransactionStatus = (
  t: Transaction,
  ts: TransactionStatus,
  mainAccount: Account,
): string => {
  // const bridge = getBridgeByTransaction(t);
  // return bridge.serializationBridge.formatTransactionStatus(t, ts, mainAccount);
  return callSerializeBridgeFunc(t, "toTransactionRaw");
};
