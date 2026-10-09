// Encapsulate for LLD et LLM
export * from "@ledgerhq/coin-algorand/types";

import type { TransactionCommon, TransactionCommonRaw } from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

/** `changeTrust` is the generic framework's opt-in mode. */
export type AlgorandGenericTransactionMode = "send" | "changeTrust";

/**
 * The transaction shape the apps write. Not named `Transaction`: that would shadow the legacy type
 * coin-algorand's bridge still reads (`memo`, `assetId`, `mode: "optIn"`).
 */
export type AlgorandGenericTransaction = TransactionCommon & {
  family: "algorand";
  mode: AlgorandGenericTransactionMode;
  fees?: BigNumber | null;
  memoType?: string | null;
  memoValue?: string | null;
  assetReference?: string;
  assetOwner?: string;
};

export type AlgorandGenericTransactionRaw = TransactionCommonRaw & {
  family: "algorand";
  mode: AlgorandGenericTransactionMode;
  fees?: string | null;
  memoType?: string | null;
  memoValue?: string | null;
  assetReference?: string;
  assetOwner?: string;
};
