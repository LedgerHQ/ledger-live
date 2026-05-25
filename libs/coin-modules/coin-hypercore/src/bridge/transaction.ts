import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/ledger-wallet-framework/serialization/transaction";
import { formatTransactionStatus } from "@ledgerhq/ledger-wallet-framework/formatters";
import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";

/**
 * Read-only stubs: hypercore does not support sending; these are present only
 * to satisfy the coin-module loader contract.
 */

export const fromTransactionRaw = (tr: TransactionCommonRaw): TransactionCommon =>
  fromTransactionCommonRaw(tr);

export const toTransactionRaw = (t: TransactionCommon): TransactionCommonRaw =>
  toTransactionCommonRaw(t);

export const formatTransaction = (_tx: TransactionCommon): string => "hypercore: read-only";

export default {
  fromTransactionRaw,
  toTransactionRaw,
  formatTransaction,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus: formatTransactionStatus as unknown as (
    tx: TransactionCommon,
    status: TransactionStatusCommon,
  ) => string,
};
