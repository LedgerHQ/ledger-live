import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { formatTransactionStatus } from "@ledgerhq/ledger-wallet-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization/transaction";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";

function pickTokenFields({ mode, assetReference, assetOwner }: Transaction | TransactionRaw) {
  return {
    ...(mode && { mode }),
    ...(assetReference && { assetReference }),
    ...(assetOwner && { assetOwner }),
  };
}

function formatAmount(account: AccountLike, amount: BigNumber): string {
  return formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
    showCode: true,
    disableRounding: true,
  });
}

export function formatTransaction(transaction: Transaction, mainAccount: Account): string {
  const { amount, fees, tag, subAccountId } = transaction;
  const account =
    mainAccount.subAccounts?.find(subAccount => subAccount.id === subAccountId) ?? mainAccount;

  const sentAmount = transaction.useAllAmount ? "MAX" : formatAmount(account, amount);

  // An opt-in has no token account to give the limit a unit
  const action =
    transaction.mode === "changeTrust"
      ? `TRUST ${transaction.assetReference} ISSUED BY ${transaction.assetOwner}\nLIMIT ${amount.toFixed()}`
      : `SEND ${sentAmount}\nTO ${transaction.recipient}`;

  const fee = fees ? formatAmount(mainAccount, fees) : "?";

  const tagLine = tag ? `\n  tag=${tag}` : "";

  return `
${action}
with fee=${fee}${tagLine}`;
}

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
