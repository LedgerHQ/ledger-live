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
import BigNumber from "bignumber.js";

export const formatTransaction = (
  { recipient, useAllAmount, amount }: Transaction,
  account: Account
): string => `
SEND ${
  useAllAmount
    ? "MAX"
    : amount.isZero()
    ? ""
    : " " +
      formatCurrencyUnit(getAccountUnit(account), amount, {
        showCode: true,
        disableRounding: true,
      })
}
TO ${recipient}`;

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    version: tr.version,
    method: tr.method,
    nonce: tr.nonce,
    amount: new BigNumber(tr.amount),
    gasFeeCap: new BigNumber(tr.gasFeeCap),
    gasLimit: new BigNumber(tr.gasLimit),
    gasPremium: new BigNumber(tr.gasPremium),
  };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);

  return {
    ...common,
    method: t.method,
    version: t.version,
    family: t.family,
    nonce: t.nonce,
    amount: t.amount.toFixed(),
    gasFeeCap: t.gasFeeCap.toString(),
    gasLimit: t.gasLimit.toNumber(),
    gasPremium: t.gasPremium.toString(),
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
