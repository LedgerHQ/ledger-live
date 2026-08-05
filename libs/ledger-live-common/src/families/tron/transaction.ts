import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account";
import { formatTransactionStatus } from "@ledgerhq/ledger-wallet-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { Transaction, TransactionRaw } from "./types";

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => ({
  ...fromTransactionCommonRaw(tr),
  family: tr.family,
  mode: tr.mode,
  fees: tr.fees ? new BigNumber(tr.fees) : null,
  // Chain-specific fields round-trip verbatim: the bag is JSON-serializable by contract
  // (see `GenericTransaction.familySpecificData`), so there is nothing to revive. Omitted when
  // absent, matching the generic `toGenericTransactionRaw`.
  ...(tr.familySpecificData ? { familySpecificData: tr.familySpecificData } : {}),
});

export const toTransactionRaw = (t: Transaction): TransactionRaw => ({
  ...toTransactionCommonRaw(t),
  family: t.family,
  mode: t.mode,
  fees: t.fees ? t.fees.toString() : null,
  ...(t.familySpecificData ? { familySpecificData: t.familySpecificData } : {}),
});

export const formatTransaction = (t: Transaction, mainAccount: Account): string => {
  const account =
    (t.subAccountId && (mainAccount.subAccounts || []).find(a => a.id === t.subAccountId)) ||
    mainAccount;
  const { resource, votes } = t.familySpecificData ?? {};
  return `
${t.mode.toUpperCase()}${resource ? " " + resource : ""} ${
    t.useAllAmount
      ? "MAX"
      : t.amount.isZero()
        ? ""
        : " " +
          formatCurrencyUnit(getAccountCurrency(account).units[0], t.amount, {
            showCode: true,
            disableRounding: true,
          })
  }${!votes ? "" : " " + votes.map(v => v.voteCount + "->" + v.address).join(" ")}
TO ${t.recipient}`;
};

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};
