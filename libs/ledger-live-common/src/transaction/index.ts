export * from "./common";
export * from "./status";
export * from "./signOperation";
export * from "./deviceTransactionConfig";
import type { Account, Transaction, TransactionRaw } from "../types";
import transactionModulePerFamily from "../generated/transaction";
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
export const formatTransaction = (t: Transaction, a: Account): string => {
  const TM = transactionModulePerFamily[t.family];
  // FIXME: something is wrong with TM.formatTransaction expecting a (arg: never) => for some reasons
  return TM.formatTransaction ? TM.formatTransaction(t as any, a) : "";
};
