import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { formatTransactionStatus } from "@ledgerhq/ledger-wallet-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { AlgorandGenericTransaction, AlgorandGenericTransactionRaw } from "./types";

export function formatTransaction(
  { mode, subAccountId, amount, recipient, fees, useAllAmount }: AlgorandGenericTransaction,
  mainAccount: Account,
): string {
  const account =
    (subAccountId && (mainAccount.subAccounts || []).find(a => a.id === subAccountId)) ||
    mainAccount;
  return `
    ${mode === "changeTrust" ? "OPT_IN" : "SEND"} ${
      useAllAmount
        ? "MAX"
        : formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
            showCode: true,
            disableRounding: false,
          })
    }
    TO ${recipient}
    with fees=${
      !fees
        ? "?"
        : formatCurrencyUnit(mainAccount.currency.units[0], fees, {
            showCode: true,
            disableRounding: false,
          })
    }`;
}

export function fromTransactionRaw(tr: AlgorandGenericTransactionRaw): AlgorandGenericTransaction {
  return {
    ...fromTransactionCommonRaw(tr),
    family: tr.family,
    mode: tr.mode,
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    memoType: tr.memoType,
    memoValue: tr.memoValue,
    assetReference: tr.assetReference,
    assetOwner: tr.assetOwner,
  };
}

export function toTransactionRaw(t: AlgorandGenericTransaction): AlgorandGenericTransactionRaw {
  return {
    ...toTransactionCommonRaw(t),
    family: t.family,
    mode: t.mode,
    fees: t.fees ? t.fees.toString() : null,
    memoType: t.memoType,
    memoValue: t.memoValue,
    assetReference: t.assetReference,
    assetOwner: t.assetOwner,
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
