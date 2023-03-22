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

  const tx = {
    ...common,
    family: tr.family,
    mode: tr.mode,
    memo: tr.memo,
  };

  switch (tr.mode) {
    case "stake":
      return {
        ...tx,
        staked: { ...tr.staked! },
      };

    // default is `TransferTransaction` (Send)
    default:
      return tx;
  }
}

export function toTransactionRaw(t: Transaction): TransactionRaw {
  const common = toTransactionCommonRaw(t);

  const tx = {
    ...common,
    family: t.family,
    memo: t.memo,
  };

  switch (t.mode) {
    case "stake":
      return {
        ...tx,
        staked: { ...t.staked! },
      };

    // default is `TransferTransaction` (Send)
    default:
      return tx;
  }
}

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};
