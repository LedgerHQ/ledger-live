import type {
  Transaction,
  TransactionRaw,
  TransactionStatus,
  TransactionStatusRaw,
} from "./types";
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

export function formatTransaction(
  transaction: Transaction,
  account: Account
): string {
  const amount = formatCurrencyUnit(
    getAccountUnit(account),
    transaction.amount,
    {
      showCode: true,
      disableRounding: true,
    }
  );

  return `SEND ${amount}\nTO ${transaction.recipient}`;
}

export function fromTransactionRaw(tr: TransactionRaw): Transaction {
  const common = fromTransactionCommonRaw(tr);

  return {
    ...common,
    family: tr.family,
  };
}

export function toTransactionRaw(t: Transaction): TransactionRaw {
  const common = toTransactionCommonRaw(t);

  return {
    ...common,
    family: t.family,
  };
}

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
