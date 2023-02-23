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
    memo: tr.memo,
  };
}

export function toTransactionRaw(t: Transaction): TransactionRaw {
  const common = toTransactionCommonRaw(t);

  return {
    ...common,
    family: t.family,
    memo: t.memo,
  };
}

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};
