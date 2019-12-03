// @flow
import { BigNumber } from "bignumber.js";
import type {
  Transaction,
  TransactionRaw,
  FeeItems,
  FeeItemsRaw
} from "./types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw
} from "../../transaction/common";

const fromFeeItemsRaw = (fir: FeeItemsRaw): FeeItems => ({
  items: fir.items.map(fi => ({
    key: fi.key,
    speed: fi.speed,
    feePerByte: BigNumber(fi.feePerByte)
  })),
  defaultFeePerByte: BigNumber(fir.defaultFeePerByte)
});

const toFeeItemsRaw = (fir: FeeItems): FeeItemsRaw => ({
  items: fir.items.map(fi => ({
    key: fi.key,
    speed: fi.speed,
    feePerByte: fi.feePerByte.toString()
  })),
  defaultFeePerByte: fir.defaultFeePerByte.toString()
});

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    feePerByte: tr.feePerByte ? BigNumber(tr.feePerByte) : null,
    networkInfo: tr.networkInfo && {
      family: tr.networkInfo.family,
      feeItems: fromFeeItemsRaw(tr.networkInfo.feeItems)
    }
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    feePerByte: t.feePerByte ? t.feePerByte.toString() : null,
    networkInfo: t.networkInfo && {
      family: t.networkInfo.family,
      feeItems: toFeeItemsRaw(t.networkInfo.feeItems)
    }
  };
};

export default { fromTransactionRaw, toTransactionRaw };
