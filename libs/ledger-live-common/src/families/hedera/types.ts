// Encapsulate for LLD & LLM
export * from "@ledgerhq/coin-hedera/types/index";

import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { BigNumber } from "bignumber.js";

/** The framework's mode spelling, not coin-hedera's `HEDERA_TRANSACTION_MODES`. */
export type HederaTransactionMode =
  | "send"
  | "tokenAssociate"
  | "delegate"
  | "undelegate"
  | "redelegate"
  | "claimReward";

/** Shadows the legacy `Transaction` re-exported above. */
export type Transaction = TransactionCommon & {
  family: "hedera";
  mode: HederaTransactionMode;
  fees?: BigNumber | null;
  memoType?: string | null;
  memoValue?: string | null;
  assetReference?: string;
  assetOwner?: string;
  valId?: string;
  gasLimit?: BigNumber | null;
  /**
   * Always set (`createTransaction` defaults it to 0) so `signOperation` never reaches
   * `getNextSequence`, which coin-hedera throws from: a Hedera transaction has no account sequence.
   */
  nonce?: BigNumber | null;
  customFees?: {
    parameters: { fees?: BigNumber | null };
  };
  /** Derived by `prepareTransaction`, so `TransactionRaw` omits it. */
  feeParameters?: Record<string, unknown>;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "hedera";
  mode: HederaTransactionMode;
  fees?: string | null;
  memoType?: string | null;
  memoValue?: string | null;
  assetReference?: string;
  assetOwner?: string;
  valId?: string;
  gasLimit?: string | null;
  nonce?: string | null;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
