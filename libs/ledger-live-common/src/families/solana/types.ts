import type {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type BigNumber from "bignumber.js";
import type { TransferFee } from "../../bridge/generic-coin-framework/types";

// Encapsulate for LLD et LLM
export * from "@ledgerhq/coin-solana/types";

/**
 * The flows Solana exposes on top of a plain `send`: the staking ones the apps drive, and the four
 * token/stake commands only a live app submits, through the wallet API.
 */
export type SolanaTransactionMode =
  | "send"
  | "stake"
  | "delegate"
  | "undelegate"
  | "unstake"
  | "opt-in"
  | "approve"
  | "revoke"
  | "split";

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
   * Rent of the stake account a delegation creates, written by the generic `prepareTransaction`.
   * It leaves the wallet on top of the delegated amount, which is why the device shows the sum.
   * Derived, so `TransactionRaw` deliberately omits it.
   */
  stakeAccountRent?: BigNumber;
  /**
   * The associated token account a `opt-in`, `approve` or `revoke` acts on, derived from the chain
   * by `estimateFees`. Derived, so `TransactionRaw` deliberately omits it.
   */
  ownerTokenAccount?: string;
  /**
   * A transaction a partner already built -- LiFi's swap payload, written by
   * `exchange/swap/transactionStrategies.ts`. `bridge/api.ts:buildIntentData` carries it to the
   * coin module, which signs those bytes instead of crafting from the intent.
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
