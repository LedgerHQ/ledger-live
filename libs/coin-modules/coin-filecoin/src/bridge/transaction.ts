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
import type { Transaction, TransactionRaw } from "../types";

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
  return {
    ...common,
    family: tr.family,
    version: tr.version,
    method: tr.method,
    nonce: tr.nonce,
    amount: new BigNumber(tr.amount),
    gasFeeCap: new BigNumber(tr.gasFeeCap),
    gasLimit: new BigNumber(tr.gasLimit),
    gasPremium: new BigNumber(tr.gasPremium),
  };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);

  return {
    ...common,
    method: t.method,
    version: t.version,
    family: t.family,
    nonce: t.nonce,
    amount: t.amount.toFixed(),
    gasFeeCap: t.gasFeeCap.toString(),
    gasLimit: t.gasLimit.toNumber(),
    gasPremium: t.gasPremium.toString(),
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
