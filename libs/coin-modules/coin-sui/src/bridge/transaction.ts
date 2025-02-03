import type { Account } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "@ledgerhq/coin-framework/serialization";
import { BigNumber } from "bignumber.js";
import { getAccountUnit } from "./utils";
import type { Transaction, TransactionRaw } from "../types";

export const formatTransaction = (
  { mode, amount, recipient, useAllAmount }: Transaction,
  account: Account,
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
  }${recipient ? `\nTO ${recipient}` : ""}`;

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    mode: tr.mode,
    fees: tr.fees ? BigNumber(tr.fees) : null,
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    mode: t.mode,
    fees: t.fees?.toString() || "", // TODO: fix
  };
};

export default { formatTransaction, fromTransactionRaw, toTransactionRaw };
