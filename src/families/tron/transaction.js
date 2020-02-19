// @flow
import type { Transaction, TransactionRaw } from "./types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw
} from "../../transaction/common";

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    networkInfo: tr.networkInfo,
    family: tr.family,
    mode: tr.mode,
    resource: tr.resource || null,
    duration: tr.duration || 3,
    votes: tr.votes
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    networkInfo: t.networkInfo,
    family: t.family,
    mode: t.mode,
    resource: t.resource || null,
    duration: t.duration || 3,
    votes: t.votes
  };
};

export default { fromTransactionRaw, toTransactionRaw };
