import type { Transaction, TransactionRaw } from "./types";
import {
  formatTransactionStatusCommon,
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon,
} from "../../transaction/common";
import type { Account } from "@ledgerhq/types-live";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
export const formatTransaction = (t: Transaction, account: Account): string => `
SEND ${formatCurrencyUnit(getAccountUnit(account), t.amount, {
  showCode: true,
  disableRounding: true,
})}
TO ${t.recipient}`;

const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return { ...common, family: tr.family };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return { ...common, family: t.family };
};

const fromTransactionStatusRaw = fromTransactionStatusRawCommon;
const toTransactionStatusRaw = toTransactionStatusRawCommon;
const formatTransactionStatus = formatTransactionStatusCommon;

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};
