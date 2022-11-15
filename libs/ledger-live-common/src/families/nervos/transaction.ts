import type { Transaction, TransactionRaw } from "./types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
  formatTransactionStatusCommon as formatTransactionStatus,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "../../transaction/common";
import BigNumber from "bignumber.js";

export const formatTransaction = (): string => {
  return "Nervos formatTransaction called";
};

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    mode: tr.mode,
    feePerByte: new BigNumber(tr.feePerByte),
  };
};

export const toTransactionRaw = (tr: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    mode: tr.mode,
    feePerByte: tr.feePerByte.toString(),
  };
};

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};
