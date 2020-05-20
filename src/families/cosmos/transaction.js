// @flow
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "../../transaction/common";
import type { Account } from "../../types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

export const formatTransaction = (
  {
    mode,
    amount,
    fees,
    recipient,
    validators,
    memo,
    cosmosSourceValidator,
    useAllAmount,
  }: Transaction,
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
  }${
    !validators
      ? ""
      : " " +
        validators
          .map(
            (v) =>
              formatCurrencyUnit(getAccountUnit(account), v.amount) +
              "->" +
              v.address
          )
          .join(" ")
  }${
    !cosmosSourceValidator
      ? ""
      : "\n  source validator=" + cosmosSourceValidator
  }
  TO ${recipient}
  with fees=${fees ? formatCurrencyUnit(getAccountUnit(account), fees) : "?"}${
    !memo ? "" : `\n  memo=${memo}`
  }`;

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const { networkInfo } = tr;
  return {
    ...common,
    family: tr.family,
    mode: tr.mode,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      fees: BigNumber(networkInfo.fees),
    },
    fees: tr.fees ? BigNumber(tr.fees) : null,
    gasLimit: tr.gasLimit ? BigNumber(tr.gasLimit) : null,
    memo: tr.memo,
    cosmosSourceValidator: tr.cosmosSourceValidator,
    validators: tr.validators
      ? tr.validators.map((v) => ({
          ...v,
          amount: BigNumber(v.amount),
        }))
      : [],
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  const { networkInfo } = t;
  return {
    ...common,
    family: t.family,
    mode: t.mode,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      fees: networkInfo.fees.toString(),
    },
    fees: t.fees ? t.fees.toString() : null,
    gasLimit: t.gasLimit ? t.gasLimit.toString() : null,
    memo: t.memo,
    cosmosSourceValidator: t.cosmosSourceValidator,
    validators: t.validators
      ? t.validators.map((v) => ({
          ...v,
          amount: v.amount.toString(),
        }))
      : [],
  };
};

export default { formatTransaction, fromTransactionRaw, toTransactionRaw };
