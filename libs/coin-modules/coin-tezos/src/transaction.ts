import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";

export const formatTransaction = (
  {
    mode,
    subAccountId,
    amount,
    recipient,
    gasLimit,
    storageLimit,
    fees,
    useAllAmount,
    estimatedFees,
  }: Transaction,
  mainAccount: Account,
): string => {
  const account =
    (subAccountId && (mainAccount.subAccounts || []).find(a => a.id === subAccountId)) ||
    mainAccount;
  return `
${mode.toUpperCase()} ${
    useAllAmount
      ? "MAX"
      : formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
          showCode: true,
          disableRounding: true,
        })
  }
TO ${recipient}
with fees=${!fees ? "?" : formatCurrencyUnit(mainAccount.currency.units[0], fees)}
with gasLimit=${!gasLimit ? "?" : gasLimit.toString()}
with storageLimit=${!storageLimit ? "?" : storageLimit.toString()}
(estimatedFees ${
    !estimatedFees ? "?" : formatCurrencyUnit(mainAccount.currency.units[0], estimatedFees)
  })`;
};

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
    gasLimit: tr.gasLimit ? new BigNumber(tr.gasLimit) : undefined,
    storageLimit: tr.storageLimit ? new BigNumber(tr.storageLimit) : undefined,
    estimatedFees: tr.estimatedFees ? new BigNumber(tr.estimatedFees) : undefined,
    taquitoError: tr.taquitoError,
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
    storageLimit: t.storageLimit ? t.storageLimit.toString() : null,
    estimatedFees: t.estimatedFees ? t.estimatedFees.toString() : null,
    taquitoError: t.taquitoError,
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
