export * from "@ledgerhq/coin-framework/transaction/common";
export * from "./deviceTransactionConfig";
export * from "./signOperation";
import type {
  Account,
  SerializationBridge,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import {
  getAccountBridgeByFamily,
  getBridgeByFamily,
  getBridgeByTransaction,
  getBridgeByTransaction2,
} from "../bridge/impl";
import type {
  Transaction,
  TransactionRaw,
  TransactionStatus,
  TransactionStatusRaw,
} from "../generated/types";
import jsBridges from "../generated/bridge/js";
import {
  Transaction as AptosTransaction,
  TransactionRaw as AptosTransactionRaw,
} from "@ledgerhq/coin-aptos/index";

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  // return getAccountBridgeByFamily(tr.family).fromTransactionRaw(tr);
  const bridge = getBridgeByTransaction(tr);
  return bridge.serializationBridge.fromTransactionRaw(tr);
  // if (isAptosTransactionRaw(tr) === true) {
  //   return jsBridges.aptos.serializationBridge.fromTransactionRaw(tr);
  // }
  throw new Error("Unsupported coin family");
};
export const fromTransactionRaw2 = <T extends TransactionCommon, TR extends TransactionCommonRaw>(
  tr: TR,
): T => {
  // return getAccountBridgeByFamily(tr.family).fromTransactionRaw(tr);
  const bridge = getBridgeByTransaction2(tr);
  return bridge.serializationBridge.fromTransactionRaw(tr);
  // if (isAptosTransactionRaw(tr) === true) {
  //   return jsBridges.aptos.serializationBridge.fromTransactionRaw(tr);
  // }
  throw new Error("Unsupported coin family");
};
export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  return getBridgeByFamily(t.family).serializationBridge.toTransactionRaw(t) as TransactionRaw;
};

// export const fromTxRaw = <T, R>(tr: R): T => {
//   getSerializationBridge(tr)
// };

function isAptosTransaction(tx: TransactionCommon): tx is AptosTransaction {
  return tx.family === "aptos";
}
function isAptosTransactionRaw(tx: TransactionCommonRaw): tx is AptosTransactionRaw {
  return tx.family === "aptos";
}

export const getSerializationBridge = <
  T extends TransactionCommon,
  TR extends TransactionCommonRaw = TransactionCommonRaw,
  U extends TransactionStatusCommon = TransactionStatusCommon,
  UR extends TransactionStatusCommonRaw = TransactionStatusCommonRaw,
>(
  tx: T,
): SerializationBridge<T, TR, U, UR> => {
  if (isAptosTransaction(tx) === true) {
    // if (typeof tx === "AptosTransaction") {
    return jsBridges.aptos.serializationBridge;
  }
  throw new Error("Unsupported coin family");
  // switch (tx.family) {
  //   case "aptos":
  //     return jsBridges.aptos.serializationBridge;
  //   default: {
  //     throw new Error("Unsupported coin family");
  //   }
  // }
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
