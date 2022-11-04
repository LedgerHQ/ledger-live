import type { Transaction, TransactionRaw } from "./types";
import {
  formatTransactionStatusCommon as formatTransactionStatus,
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "../../transaction/common";
import type { Account } from "@ledgerhq/types-live";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import BigNumber from "bignumber.js";
import { DeployUtil } from "casper-js-sdk";

export const formatTransaction = (
  { recipient, useAllAmount, amount }: Transaction,
  account: Account
): string => `
SEND ${
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
TO ${recipient}`;

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    deploy: DeployUtil.deployFromJson(tr.deploy).unwrap(),
    family: tr.family,
    amount: new BigNumber(tr.amount),
  };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);

  return {
    ...common,
    family: t.family,
    amount: t.amount.toFixed(),
    deploy: DeployUtil.deployToJson(t.deploy),
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
