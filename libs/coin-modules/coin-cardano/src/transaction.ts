import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import type { Account, SerializationTransactionBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";

type CardanoSerializationTransactionBridge = SerializationTransactionBridge<
  Transaction,
  TransactionRaw
>;

export const formatTransaction = (
  { mode, amount, recipient, useAllAmount, subAccountId }: Transaction,
  mainAccount: Account,
): string => {
  const account =
    (subAccountId && (mainAccount.subAccounts || []).find(a => a.id === subAccountId)) ||
    mainAccount;
  return `
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
};

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    mode: tr.mode,
    fees: tr.fees ? new BigNumber(tr.fees) : undefined,
    memo: tr.memo,
    poolId: tr.poolId,
    protocolParams: tr.protocolParams,
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    mode: t.mode,
    fees: t.fees?.toString() || undefined,
    memo: t.memo,
    poolId: t.poolId,
    protocolParams: t.protocolParams,
  };
};

export const serialization = {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
} satisfies CardanoSerializationTransactionBridge;
