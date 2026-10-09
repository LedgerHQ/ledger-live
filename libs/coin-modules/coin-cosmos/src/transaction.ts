import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { formatTransactionStatus } from "@ledgerhq/ledger-wallet-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { resolveSourceValidator, resolveTransactionValidators } from "./buildTransaction";
import type { Transaction, TransactionRaw } from "./types";

export const formatTransaction = (transaction: Transaction, account: Account): string => {
  const { mode, amount, fees, recipient, memo, useAllAmount } = transaction;
  const validators = resolveTransactionValidators(transaction);
  const sourceValidator = resolveSourceValidator(transaction);
  return `
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
  }
TO ${recipient}
${validators
  .map(
    v =>
      "  " +
      formatCurrencyUnit(getAccountCurrency(account).units[0], v.amount, {
        disableRounding: true,
      }) +
      " -> " +
      v.address,
  )
  .join("\n")}${!sourceValidator ? "" : "\n  source validator=" + sourceValidator}
with fees=${fees ? formatCurrencyUnit(getAccountCurrency(account).units[0], fees) : "?"}${
    !memo ? "" : `\n  memo=${memo}`
  }`;
};

/**
 * Transactions persisted before `valAddress`/`dstValAddress` only carry `validators` and
 * `sourceValidator`: derive the new fields from them.
 */
function legacyValidatorFields(tr: TransactionRaw): {
  valAddress?: string;
  dstValAddress?: string;
} {
  if (tr.mode === "send") return {};
  if (tr.mode === "redelegate") {
    return {
      valAddress: tr.valAddress ?? tr.sourceValidator ?? "",
      dstValAddress: tr.dstValAddress ?? tr.validators?.[0]?.address ?? "",
    };
  }
  return { valAddress: tr.valAddress ?? tr.validators?.[0]?.address ?? "" };
}

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const { networkInfo } = tr;

  // A `null` memo field is kept as `null`: the generic `createTransaction` creates it that way, and
  // a round trip must give back the transaction it was given.
  let memoValue = tr.memoValue;
  if (
    (memoValue === undefined || memoValue === null) &&
    tr.memo !== undefined &&
    tr.memo !== null
  ) {
    memoValue = tr.memo;
  }

  let memoType = tr.memoType;
  if (
    (memoType === undefined || memoType === null) &&
    memoValue !== undefined &&
    memoValue !== null
  ) {
    memoType = "text";
  }

  return {
    ...common,
    family: tr.family,
    networkInfo: networkInfo && {
      family: networkInfo.family,
      fees: new BigNumber(networkInfo.fees),
    },
    fees: tr.fees ? new BigNumber(tr.fees) : null,
    gas: tr.gas === undefined ? undefined : tr.gas ? new BigNumber(tr.gas) : null,
    memo: tr.memo,
    ...(memoType !== undefined ? { memoType } : {}),
    ...(memoValue !== undefined ? { memoValue } : {}),
    mode: tr.mode,
    ...legacyValidatorFields(tr),
  } as Transaction;
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
    gas: t.gas === undefined ? undefined : t.gas ? t.gas.toString() : null,
    memo: t.memo,
    ...(t.memoType !== undefined ? { memoType: t.memoType } : {}),
    ...(t.memoValue !== undefined ? { memoValue: t.memoValue } : {}),
    ...(t.mode !== "send" ? { valAddress: t.valAddress } : {}),
    ...(t.mode === "redelegate" ? { dstValAddress: t.dstValAddress } : {}),
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
