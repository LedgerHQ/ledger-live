import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { formatTransactionStatus } from "@ledgerhq/ledger-wallet-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "../types/types";
export const formatTransaction = (t: Transaction, account: Account): string => `
SEND ${
  t.useAllAmount
    ? "MAX CELO"
    : formatCurrencyUnit(getAccountCurrency(account).units[0], t.amount, {
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
    feeCurrency: tr.feeCurrency,
    feeCurrencyUnwrapped: tr.feeCurrencyUnwrapped,
    feeCurrencyAccountId: tr.feeCurrencyAccountId,
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
    feeCurrency: t.feeCurrency,
    feeCurrencyUnwrapped: t.feeCurrencyUnwrapped,
    feeCurrencyAccountId: t.feeCurrencyAccountId,
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
