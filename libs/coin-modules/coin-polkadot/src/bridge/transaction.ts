import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import type { Account, SerializationBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "../types";

type PolkadotSerializationBridge = SerializationBridge<Transaction, TransactionRaw>;

const formatTransaction = (
  { mode, amount, recipient, validators, useAllAmount }: Transaction,
  account: Account,
): string => `
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
}${recipient ? `\nTO ${recipient}` : ""}${!validators ? "" : validators.join("\n")}`;

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  return {
    ...common,
    family: tr.family,
    mode: tr.mode,
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    validators: tr.validators,
    era: tr.era,
    rewardDestination: tr.rewardDestination,
    numSlashingSpans: tr.numSlashingSpans,
  };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  return {
    ...common,
    family: t.family,
    mode: t.mode,
    fees: t.fees?.toString() || null,
    validators: t.validators,
    era: t.era,
    rewardDestination: t.rewardDestination,
    numSlashingSpans: t.numSlashingSpans,
  };
};

export const serialization = {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
} satisfies PolkadotSerializationBridge;
