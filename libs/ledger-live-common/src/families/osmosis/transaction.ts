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
  { mode, amount, recipient, useAllAmount, memo }: Transaction,
  account: Account
): string =>
  `
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
  }${recipient ? `\nTO ${recipient}` : ""}${
    !memo ? "" : `\n with memo=${memo}`
  }`;

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    mode: tr.mode,
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    gas: tr.gas ? new BigNumber(tr.gas) : null,
    memo: tr.memo,
    validators: tr.validators
      ? tr.validators.map((v) => ({ ...v, amount: new BigNumber(v.amount) }))
      : [],
  };
};

export const toTransactionRaw = (tr: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    mode: tr.mode,
    fees: tr.fees?.toString() || null,
    gas: tr.gas ? tr.gas.toString() : null,
    memo: tr.memo,
    validators: tr.validators
      ? tr.validators.map((v) => ({ ...v, amount: v.amount.toString() }))
      : [],
  };
};

export default { formatTransaction, fromTransactionRaw, toTransactionRaw };
