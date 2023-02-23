import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";
import {
  formatTransactionStatusCommon as formatTransactionStatus,
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/transaction/common";
import type { Account } from "@ledgerhq/types-live";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
export const formatTransaction = (
  { amount, recipient, fee, tag, useAllAmount }: Transaction,
  account: Account
): string => `
SEND ${
  useAllAmount
    ? "MAX"
    : formatCurrencyUnit(getAccountUnit(account), amount, {
        showCode: true,
        disableRounding: true,
      })
}
TO ${recipient}
with fee=${
  !fee
    ? "?"
    : formatCurrencyUnit(getAccountUnit(account), fee, {
        showCode: true,
        disableRounding: true,
      })
}${tag ? "\n  tag=" + tag : ""}`;
export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const { networkInfo } = tr;
  return {
    ...common,
    family: tr.family,
    tag: tr.tag,
    fee: tr.fee ? new BigNumber(tr.fee) : null,
    feeCustomUnit: tr.feeCustomUnit,
    // FIXME remove this field. this is not good.. we're dereferencing here. we should instead store an index (to lookup in currency.units on UI)
    networkInfo: networkInfo && {
      family: networkInfo.family,
      serverFee: new BigNumber(networkInfo.serverFee),
      baseReserve: new BigNumber(networkInfo.baseReserve),
    },
  };
};
export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  const { networkInfo } = t;
  return {
    ...common,
    family: t.family,
    tag: t.tag,
    fee: t.fee ? t.fee.toString() : null,
    feeCustomUnit: t.feeCustomUnit,
    // FIXME remove this field. this is not good.. we're dereferencing here. we should instead store an index (to lookup in currency.units on UI)
    networkInfo: networkInfo && {
      family: networkInfo.family,
      serverFee: networkInfo.serverFee.toString(),
      baseReserve: networkInfo.baseReserve.toString(),
    },
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
