import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { formatTransactionStatus } from "@ledgerhq/ledger-wallet-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization/transaction";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";

function pickTokenFields(transaction: Transaction | TransactionRaw) {
  return {
    ...(transaction.mode && { mode: transaction.mode }),
    ...(transaction.assetReference && { assetReference: transaction.assetReference }),
    ...(transaction.assetOwner && { assetOwner: transaction.assetOwner }),
    ...(typeof transaction.noRipple === "boolean" && { noRipple: transaction.noRipple }),
  };
}

function getAmountUnit(account: Account, subAccountId: string | null | undefined) {
  const sentAccount = account.subAccounts?.find(a => a.id === subAccountId) ?? account;

  return getAccountCurrency(sentAccount).units[0];
}

export const formatTransaction = (
  { amount, recipient, fees, tag, useAllAmount, subAccountId }: Transaction,
  account: Account,
): string => `
SEND ${
  useAllAmount
    ? "MAX"
    : formatCurrencyUnit(getAmountUnit(account, subAccountId), amount, {
        showCode: true,
        disableRounding: true,
      })
}
TO ${recipient}
with fee=${
  !fees
    ? "?"
    : formatCurrencyUnit(getAccountCurrency(account).units[0], fees, {
        showCode: true,
        disableRounding: true,
      })
}${tag ? "\n  tag=" + tag : ""}`;

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const { networkInfo } = tr;
  return {
    ...common,
    ...pickTokenFields(tr),
    family: tr.family,
    tag: tr.tag,
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      serverFee: new BigNumber(networkInfo.serverFee),
    },
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  const { networkInfo } = t;
  return {
    ...common,
    ...pickTokenFields(t),
    family: t.family,
    tag: t.tag,
    fees: t.fees ? t.fees.toString() : null,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      serverFee: networkInfo.serverFee.toString(),
    },
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
