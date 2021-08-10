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
): string => `
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
}
TO ${recipient}
${
  !validators
    ? ""
    : validators
        .map(
          (v) =>
            "  " +
            formatCurrencyUnit(getAccountUnit(account), v.amount, {
              disableRounding: true,
            }) +
            " -> " +
            v.address
        )
        .join("\n")
}${
  !cosmosSourceValidator ? "" : "\n  source validator=" + cosmosSourceValidator
}
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
      fees: new BigNumber(networkInfo.fees),
    },
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    gas: tr.gas ? new BigNumber(tr.gas) : null,
    memo: tr.memo,
    cosmosSourceValidator: tr.cosmosSourceValidator,
    validators: tr.validators
      ? tr.validators.map((v) => ({ ...v, amount: new BigNumber(v.amount) }))
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
    gas: t.gas ? t.gas.toString() : null,
    memo: t.memo,
    cosmosSourceValidator: t.cosmosSourceValidator,
    validators: t.validators
      ? t.validators.map((v) => ({ ...v, amount: v.amount.toString() }))
      : [],
  };
};
export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
};
