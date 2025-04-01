import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization/transaction";
import type { Account, SerializationTransactionBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "../types";

type XrpSerializationTransactionBridge = SerializationTransactionBridge<
  Transaction,
  TransactionRaw
>;

export const formatTransaction = (
  { amount, recipient, fee, tag, useAllAmount }: Transaction,
  account: Account,
): string => `
SEND ${
  useAllAmount
    ? "MAX"
    : formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
        showCode: true,
        disableRounding: true,
      })
}
TO ${recipient}
with fee=${
  !fee
    ? "?"
    : formatCurrencyUnit(getAccountCurrency(account).units[0], fee, {
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

export const serialization = {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
} satisfies XrpSerializationTransactionBridge;
