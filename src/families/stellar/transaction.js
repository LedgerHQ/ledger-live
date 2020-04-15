// @flow
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw
} from "../../transaction/common";

const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const { networkInfo } = tr;

  return {
    ...common,
    family: tr.family,
    fees: tr.fees ? BigNumber(tr.fees) : null,
    baseReserve: tr.baseReserve ? BigNumber(tr.baseReserve) : null,
    memoValue: tr.memoValue ? tr.memoValue : null,
    memoType: tr.memoType ? tr.memoType : null,
    memoTypeRecommended: tr.memoTypeRecommended ? tr.memoTypeRecommended : null,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      fees: BigNumber(networkInfo.fees),
      baseReserve: BigNumber(networkInfo.baseReserve)
    }
  };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  const { networkInfo } = t;
  return {
    ...common,
    family: t.family,
    fees: t.fees ? t.fees.toString() : null,
    baseReserve: t.baseReserve ? t.baseReserve.toString() : null,
    memoValue: t.memoValue ? t.memoValue.toString() : null,
    memoType: t.memoType ? t.memoType.toString() : null,
    memoTypeRecommended: t.memoTypeRecommended ? t.memoTypeRecommended : null,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      fees: networkInfo.fees.toString(),
      baseReserve: networkInfo.baseReserve.toString()
    }
  };
};

export default { fromTransactionRaw, toTransactionRaw };
