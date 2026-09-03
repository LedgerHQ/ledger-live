import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { TransferFee } from "../../bridge/generic-coin-framework/types";

// Encapsulate for LLD et LLM
export * from "@ledgerhq/coin-solana/types";

/** The staking flows Solana exposes, on top of a plain `send`. */
export type SolanaTransactionMode = "send" | "stake" | "delegate" | "undelegate" | "unstake";

/**
 * The Solana transaction as the apps see it. Solana runs on the generic coin framework, so this
 * shadows the legacy `Transaction` re-exported above; build one through `./transactions`, which
 * owns the mapping from a flow to these fields.
 */
export type Transaction = TransactionCommon & {
  family: "solana";
  mode?: SolanaTransactionMode;
  memoType?: string | null;
  memoValue?: string | null;
  /**
   * Token-2022 transfer fee for the last estimation, written by the generic `prepareTransaction`.
   * Derived, so `TransactionRaw` deliberately omits it.
   */
  transferFee?: TransferFee;
  /**
   * LiFi's pre-built swap transaction, written by `exchange/swap/transactionStrategies.ts`. Only
   * coin-solana's legacy `prepareTransaction` consumes them; the generic bridge crafts from the
   * intent and ignores them, so LiFi Solana swaps still need wiring (behind the `lifiSolana` flag).
   */
  raw?: string;
  templateId?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "solana";
  mode?: SolanaTransactionMode;
  memoType?: string | null;
  memoValue?: string | null;
};

export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
