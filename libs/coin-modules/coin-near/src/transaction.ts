import type { Transaction, TransactionRaw } from "./types";
import { BigNumber } from "bignumber.js";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import type { Account, SerializationTransactionBridge } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";

type NearSerializationTransactionBridge = SerializationTransactionBridge<
  Transaction,
  TransactionRaw
>;

const formatTransaction = (
  { mode, amount, recipient, useAllAmount }: Transaction,
  account: Account,
): string => `
${mode.toUpperCase()} ${
  useAllAmount
    ? "MAX"
    : amount.isZero()
      ? ""
      : " " +
        formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
          showCode: true,
          disableRounding: true,
        })
}${recipient ? `\nTO ${recipient}` : ""}`;

export const fromTransactionRaw = (transactionRaw: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(transactionRaw);
  return {
    ...common,
    family: transactionRaw.family,
    mode: transactionRaw.mode,
    fees: new BigNumber(transactionRaw?.fees || 0),
  };
};

const toTransactionRaw = (transaction: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(transaction);
  const transactionRaw: TransactionRaw = {
    ...common,
    family: transaction.family,
    mode: transaction.mode,
  };
  if (transaction.fees) {
    transactionRaw.fees = transaction.fees.toString();
  }

  return transactionRaw;
};

export const serialization = {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
} satisfies NearSerializationTransactionBridge;
