import BigNumber from "bignumber.js";
import { StacksNetwork } from "./bridge/utils/api.types";
import type { Account } from "@ledgerhq/types-live";

import type { Transaction, TransactionRaw } from "./types";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import { getAccountCurrency } from "../../account";
import { formatCurrencyUnit } from "../../currencies";

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

  // validate if network is valid
  if (!StacksNetwork[tr.network]) {
    throw new Error(`network ${tr.network} not valid`);
  }

  return {
    ...common,
    family: tr.family,
    nonce: tr.nonce !== undefined ? new BigNumber(tr.nonce) : undefined,
    fee: tr.fee !== undefined ? new BigNumber(tr.fee) : undefined,
    amount: new BigNumber(tr.amount),
    network: tr.network as keyof typeof StacksNetwork,
    anchorMode: tr.anchorMode,
    memo: tr.memo,
  };
};

const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);

  return {
    ...common,
    family: t.family,
    fee: t.fee !== undefined ? t.fee.toFixed() : undefined,
    nonce: t.nonce !== undefined ? t.nonce.toFixed() : undefined,
    amount: t.amount.toFixed(),
    network: t.network,
    anchorMode: t.anchorMode,
    memo: t.memo,
  };
};

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  formatTransactionStatus,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
};
