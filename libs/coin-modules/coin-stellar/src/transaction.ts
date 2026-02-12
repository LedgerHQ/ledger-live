import { getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getAssetCodeIssuer } from "./logic";
import type { Transaction, TransactionRaw } from "./types";

// FIXME: recheck fields here (mode -> type?)
export function formatTransaction(
  { amount, recipient, fees, memoValue, useAllAmount, subAccountId }: Transaction,
  mainAccount: Account,
): string {
  const account =
    (subAccountId && (mainAccount.subAccounts || []).find(a => a.id === subAccountId)) ||
    mainAccount;

  return `
    SEND ${
      useAllAmount
        ? "MAX"
        : formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
            showCode: true,
            disableRounding: true,
          })
    }
    TO ${recipient}
    with fees=${
      !fees
        ? "?"
        : formatCurrencyUnit(getAccountCurrency(account).units[0], fees, {
            showCode: true,
            disableRounding: true,
          })
    }${memoValue ? "\n  memo=" + memoValue : ""}`;
}

function fromTransactionRaw(tr: TransactionRaw): Transaction {
  const common = fromTransactionCommonRaw(tr);
  const { networkInfo } = tr;
  const [assetReference, assetOwner] = getAssetCodeIssuer(tr);
  return {
    ...common,
    family: tr.family,
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    memoValue: tr.memoValue ? tr.memoValue : null,
    memoType: tr.memoType ? tr.memoType : null,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      fees: new BigNumber(networkInfo.fees),
      baseFee: new BigNumber(networkInfo.baseFee),
      baseReserve: new BigNumber(networkInfo.baseReserve),
      networkCongestionLevel: networkInfo.networkCongestionLevel,
    },
    mode: tr.mode,
    assetReference,
    assetOwner,
  };
}

function toTransactionRaw(transaction: Transaction): TransactionRaw {
  const common = toTransactionCommonRaw(transaction);
  const { networkInfo } = transaction;
  const [assetReference, assetOwner] = getAssetCodeIssuer(transaction);
  return {
    ...common,
    family: transaction.family,
    fees: transaction.fees ? transaction.fees.toString() : null,
    baseReserve: transaction.baseReserve ? transaction.baseReserve.toString() : null,
    memoValue: transaction.memoValue ? transaction.memoValue.toString() : null,
    memoType: transaction.memoType ? transaction.memoType.toString() : null,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      fees: networkInfo.fees.toString(),
      baseFee: networkInfo.baseFee.toString(),
      baseReserve: networkInfo.baseReserve.toString(),
      networkCongestionLevel: networkInfo.networkCongestionLevel,
    },
    mode: transaction.mode,
    assetReference,
    assetOwner,
  };
}

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};
