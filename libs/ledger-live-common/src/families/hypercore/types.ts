import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

// HyperCore has no send flow on Ledger Wallet — the transaction shape is minimal and only exists so
// accounts can round-trip through (de)serialization via the generic coin framework.
export type Transaction = TransactionCommon & {
  family: "hypercore";
  fees?: BigNumber | null;
  mode?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "hypercore";
  fees?: string | null;
  mode?: string;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
