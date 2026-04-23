import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { formatTransactionStatus } from "@ledgerhq/ledger-wallet-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Transaction, TransactionRaw } from "../types/common";

export const formatTransaction = (
  { recipient, useAllAmount, amount }: Transaction,
  account: Account,
): string => `
SEND ${
  useAllAmount
    ? "MAX"
    : amount.isZero()
      ? ""
      : " " +
        formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
          showCode: true,
          disableRounding: true,
        })
}
TO ${recipient}`;

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const transaction: Transaction = {
    ...common,
    family: tr.family,
    fees: {
      fee: new BigNumber(tr.fees.fee),
      accountCreationFee: new BigNumber(tr.fees.accountCreationFee),
    },
    amount: new BigNumber(tr.amount),
    memo: tr.memo,
    nonce: tr.nonce,
  };

  if (tr.txType) {
    transaction.txType = tr.txType;
  }

  return transaction;
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);

  const transactionRaw: TransactionRaw = {
    ...common,
    family: t.family,
    amount: t.amount.toFixed(),
    fees: {
      fee: t.fees.fee.toString(),
      accountCreationFee: t.fees.accountCreationFee.toString(),
    },
    memo: t.memo ?? undefined,
    nonce: t.nonce,
  };

  if (t.txType) {
    transactionRaw.txType = t.txType;
  }

  return transactionRaw;
};

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};
