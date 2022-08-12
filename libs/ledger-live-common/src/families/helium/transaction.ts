import type { Transaction, TransactionRaw } from "./types";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "../../transaction/common";
import type { Account } from "../../types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import BigNumber from "bignumber.js";

/**
 *
 * @param param0
 * @param account
 * @returns string
 */
export const formatTransaction = (
  { model, amount, recipient, useAllAmount }: Transaction,
  account: Account
): string =>
  `
${model.mode.toUpperCase()} ${
    useAllAmount
      ? "MAX"
      : amount.isZero()
      ? ""
      : " " +
        formatCurrencyUnit(getAccountUnit(account), amount, {
          showCode: true,
          disableRounding: true,
        })
  }${recipient ? `\nTO ${recipient}` : ""}`;

/**
 *
 * @param tr
 * @returns Transaction
 */
export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    fees: tr.fees ? new BigNumber(tr.fees) : undefined,
    model: JSON.parse(tr.model),
  };
};

/**
 *
 * @param t
 * @returns TransactionRaw
 */
export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    fees: t.fees?.toString() || undefined,
    model: JSON.stringify(t.model),
  };
};

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
};
