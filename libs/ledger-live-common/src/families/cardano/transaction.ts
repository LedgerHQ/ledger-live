import type { Transaction, TransactionRaw } from "./types";
import { BigNumber } from "bignumber.js";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "../../transaction/common";
import type { Account } from "../../types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

export const formatTransaction = (
  { mode, amount, recipient, useAllAmount, subAccountId }: Transaction,
  mainAccount: Account
): string => {
  const account =
    (subAccountId &&
      (mainAccount.subAccounts || []).find((a) => a.id === subAccountId)) ||
    mainAccount;
  return `
  ${mode.toUpperCase()} ${
    useAllAmount
      ? "MAX"
      : amount.isZero()
      ? ""
      : " " +
        formatCurrencyUnit(getAccountUnit(account), amount, {
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
  };
};

export default { formatTransaction, fromTransactionRaw, toTransactionRaw };
