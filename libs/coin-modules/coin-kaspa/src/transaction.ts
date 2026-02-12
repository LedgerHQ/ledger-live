import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { formatTransactionStatus as formatTransactionStatusCommon } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { KaspaAccount, Transaction, TransactionRaw, TransactionStatus } from "./types";

export const formatTransactionStatus = (
  t: Transaction,
  ts: TransactionStatus,
  mainAccount: KaspaAccount,
): string => {
  let str = "";

  str += formatTransactionStatusCommon(t, ts, mainAccount);

  return str;
};

export const formatTransaction = (
  { amount, recipient, useAllAmount, subAccountId }: Transaction,
  mainAccount: Account,
): string => {
  const account =
    (subAccountId && (mainAccount.subAccounts || []).find(a => a.id === subAccountId)) ||
    mainAccount;
  return `
  ${
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
};

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    networkInfo: tr.networkInfo.map(x => ({
      ...x,
      amount: BigNumber(x.amount),
    })),
    feesStrategy: tr.feesStrategy,
    customFeeRate: tr.customFeeRate ? BigNumber(tr.customFeeRate) : undefined,
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    networkInfo: t.networkInfo.map(x => ({
      ...x,
      amount: x.amount.toString(),
    })),
    feesStrategy: t.feesStrategy,
    customFeeRate: t.customFeeRate?.toString(),
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
