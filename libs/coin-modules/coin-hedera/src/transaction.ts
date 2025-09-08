import type { Transaction, TransactionRaw } from "./types";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";

export function formatTransaction(transaction: Transaction, account: Account): string {
  const amount = formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
    showCode: true,
    disableRounding: true,
  });

  return `SEND ${amount}\nTO ${transaction.recipient}`;
}

export function fromTransactionRaw(tr: TransactionRaw): Transaction {
  const common = fromTransactionCommonRaw(tr);

  if (tr.mode === "token-associate") {
    return {
      ...common,
      family: tr.family,
      memo: tr.memo,
      mode: tr.mode,
      assetReference: tr.assetReference,
      assetOwner: tr.assetOwner,
      properties: tr.properties,
    };
  }

  return {
    ...common,
    family: tr.family,
    memo: tr.memo,
    mode: tr.mode,
  };
}

export function toTransactionRaw(t: Transaction): TransactionRaw {
  const common = toTransactionCommonRaw(t);

  if (t.mode === "token-associate") {
    return {
      ...common,
      family: t.family,
      memo: t.memo,
      mode: t.mode,
      assetReference: t.assetReference,
      assetOwner: t.assetOwner,
      properties: t.properties,
    };
  }

  return {
    ...common,
    family: t.family,
    memo: t.memo,
    mode: t.mode,
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
