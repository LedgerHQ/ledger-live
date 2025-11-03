import BigNumber from "bignumber.js";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { HEDERA_TRANSACTION_MODES } from "./constants";
import type { Transaction, TransactionRaw } from "./types";

export function formatTransaction(transaction: Transaction, account: Account): string {
  const amount = formatCurrencyUnit(getAccountCurrency(account).units[0], transaction.amount, {
    showCode: true,
    disableRounding: true,
  });

  return `SEND ${amount}\nTO ${transaction.recipient}`;
}

export function fromTransactionRaw(tr: TransactionRaw): Transaction {
  const commonGeneric = fromTransactionCommonRaw(tr);
  const commonHedera = {
    family: tr.family,
    memo: tr.memo,
    ...(tr.maxFee && { maxFee: new BigNumber(tr.maxFee) }),
  };

  if (tr.mode === HEDERA_TRANSACTION_MODES.TokenAssociate) {
    return {
      ...commonGeneric,
      ...commonHedera,
      mode: tr.mode,
      assetReference: tr.assetReference,
      assetOwner: tr.assetOwner,
      properties: tr.properties,
    };
  }

  if (
    tr.mode === HEDERA_TRANSACTION_MODES.Delegate ||
    tr.mode === HEDERA_TRANSACTION_MODES.Undelegate ||
    tr.mode === HEDERA_TRANSACTION_MODES.Redelegate
  ) {
    return {
      ...commonGeneric,
      ...commonHedera,
      mode: tr.mode,
      properties: tr.properties,
    };
  }

  if (tr.mode === HEDERA_TRANSACTION_MODES.ClaimRewards) {
    return {
      ...commonGeneric,
      ...commonHedera,
      mode: tr.mode,
    };
  }

  return {
    ...commonGeneric,
    ...commonHedera,
    mode: tr.mode,
    ...(tr.gasLimit && { gasLimit: new BigNumber(tr.gasLimit) }),
  };
}

export function toTransactionRaw(t: Transaction): TransactionRaw {
  const commonGeneric = toTransactionCommonRaw(t);
  const commonHedera = {
    family: t.family,
    memo: t.memo,
    ...(t.maxFee && { maxFee: t.maxFee.toString() }),
  };

  if (t.mode === HEDERA_TRANSACTION_MODES.TokenAssociate) {
    return {
      ...commonGeneric,
      ...commonHedera,
      mode: t.mode,
      assetReference: t.assetReference,
      assetOwner: t.assetOwner,
      properties: t.properties,
    };
  }

  if (
    t.mode === HEDERA_TRANSACTION_MODES.Delegate ||
    t.mode === HEDERA_TRANSACTION_MODES.Undelegate ||
    t.mode === HEDERA_TRANSACTION_MODES.Redelegate
  ) {
    return {
      ...commonGeneric,
      ...commonHedera,
      mode: t.mode,
      properties: t.properties,
    };
  }

  if (t.mode === HEDERA_TRANSACTION_MODES.ClaimRewards) {
    return {
      ...commonGeneric,
      ...commonHedera,
      mode: t.mode,
    };
  }

  return {
    ...commonGeneric,
    ...commonHedera,
    mode: t.mode,
    ...(t.gasLimit && { gasLimit: t.gasLimit.toString() }),
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
