import type { Transaction, TransactionRaw } from "./types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "../../transaction/common";
import type { Account } from "../../types";
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

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
};
