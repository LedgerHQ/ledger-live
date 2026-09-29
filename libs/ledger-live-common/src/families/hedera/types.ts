// Encapsulate for LLD & LLM
export * from "@ledgerhq/coin-hedera/types/index";

import type { TransactionCommon, TransactionCommonRaw } from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

/** The framework's mode spelling, not coin-hedera's `HEDERA_TRANSACTION_MODES`. */
export type HederaTransactionMode =
  | "send"
  | "delegate"
  | "undelegate"
  | "redelegate"
  | "claimReward";

/**
 * The transaction on the generic coin framework path. Not named `Transaction` yet: that would shadow
 * the legacy type the apps still read (`properties`, `memo`) until they move to this shape.
 */
export type HederaGenericTransaction = TransactionCommon & {
  family: "hedera";
  mode: HederaTransactionMode;
  fees?: BigNumber | null;
  assetReference?: string;
  assetOwner?: string;
  valId?: string;
  /** Derived by `prepareTransaction`, so `HederaGenericTransactionRaw` omits it. */
  feeParameters?: Record<string, unknown>;
};

export type HederaGenericTransactionRaw = TransactionCommonRaw & {
  family: "hedera";
  mode: HederaTransactionMode;
  fees?: string | null;
  assetReference?: string;
  assetOwner?: string;
  valId?: string;
};
