// @flow
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "../../transaction/common";

const defaultGasLimit = BigNumber(0x5208);

export const getGasLimit = (t: Transaction): BigNumber =>
  t.userGasLimit || t.estimatedGasLimit || defaultGasLimit;

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const { networkInfo } = tr;
  return {
    ...common,
    family: tr.family,
    gasPrice: tr.gasPrice ? BigNumber(tr.gasPrice) : null,
    userGasLimit: tr.userGasLimit ? BigNumber(tr.userGasLimit) : null,
    estimatedGasLimit: tr.estimatedGasLimit
      ? BigNumber(tr.estimatedGasLimit)
      : null,
    feeCustomUnit: tr.feeCustomUnit, // FIXME this is not good.. we're dereferencing here. we should instead store an index (to lookup in currency.units on UI)
    networkInfo: networkInfo && {
      family: networkInfo.family,
      gasPrice: BigNumber(networkInfo.gasPrice),
    },
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  const { networkInfo } = t;
  return {
    ...common,
    family: t.family,
    gasPrice: t.gasPrice ? t.gasPrice.toString() : null,
    userGasLimit: t.userGasLimit ? t.userGasLimit.toString() : null,
    estimatedGasLimit: t.estimatedGasLimit
      ? t.estimatedGasLimit.toString()
      : null,
    feeCustomUnit: t.feeCustomUnit, // FIXME this is not good.. we're dereferencing here. we should instead store an index (to lookup in currency.units on UI)
    networkInfo: networkInfo && {
      family: networkInfo.family,
      gasPrice: networkInfo.gasPrice.toString(),
    },
  };
};

export default { fromTransactionRaw, toTransactionRaw };
