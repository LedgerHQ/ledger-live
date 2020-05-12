// @flow
import type { Transaction, TransactionRaw } from "./types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "../../transaction/common";

const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
  };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
  };
};

export default { fromTransactionRaw, toTransactionRaw };
