import type { Transaction, TransactionRaw } from "./types";
import { BigNumber } from "bignumber.js";
import {
  formatTransactionStatusCommon as formatTransactionStatus,
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/transaction/common";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { Account } from "@ledgerhq/types-live";
export const formatTransaction = (t: Transaction, account: Account): string => `
SEND ${
  t.useAllAmount
    ? "MAX CELO"
    : formatCurrencyUnit(getAccountUnit(account), t.amount, {
        showCode: true,
        disableRounding: true,
      })
}
TO ${t.recipient}`;

const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    mode: tr.mode,
    index: tr.index,
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    fees: t.fees?.toString() || null,
    mode: t.mode,
    index: t.index,
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
