import type { TransactionSource } from "@ledgerhq/types-live";
import type { ErrorCategory } from "./errorCategory";
import type { EarnTransactionType } from "./earnTransactionType";

/**
 * Identifies which pathway emitted the transaction log event — the granular "where",
 * complementing the live-app `manifestId`.
 *
 * Deliberately finer-grained than the `TransactionSource["type"]` it is attributed from
 * (`"dApp" | "live-app" | "coin-module" | "swap"`, `libs/types-live/src/transaction.ts`): the
 * values name the concrete entry point, so a future per-route tap can add one without
 * changing the source union. Every source type maps onto exactly one value today, and a test
 * in the seam pins that mapping. `Unknown` belongs to the sign stage, where no
 * `broadcastConfig` exists yet and the route is genuinely not known.
 */
export enum TransactionFlow {
  Send = "send",
  WalletApiSignAndBroadcast = "wallet-api/transaction.signAndBroadcast",
  Dapp = "dApp/eth_sendTransaction",
  Swap = "swap",
  Unknown = "unknown",
}

/** Which stage of the transaction lifecycle produced the event. */
export enum TransactionStage {
  Sign = "sign",
  Broadcast = "broadcast",
}

/**
 * Where the event's transaction data came from. Broadcast has no transaction of its own, so
 * it either reuses the sign stage's (richer) data or falls back to the optimistic operation.
 * Reported so the correlation hit-rate is measurable rather than assumed.
 */
export enum TransactionDataSource {
  Sign = "sign",
  Broadcast = "broadcast",
}

type CommonLogEvent = {
  appVersion: string;
  flow: TransactionFlow;
  /** Live-app manifest id — the primary "where". Absent for the native send flow. */
  manifestId?: string;
  source?: TransactionSource;
  /** Parent/network currency id (e.g. "ethereum"); token id is reported separately. */
  currencyId: string;
  family: string;
  tokenId?: string;
  /** Tickers, so analytics can report the asset the user recognises ("ETH", "USDC"). */
  currencyTicker: string;
  tokenTicker?: string;
  /**
   * Normalized staking action, derived per family. Distinct from `flow` (the technical
   * origin). Undefined when the transaction is not a recognised staking action — e.g. a
   * plain send or a swap — which is what keeps those out of the earn funnel.
   */
  earnTransactionType?: EarnTransactionType;
  /**
   * The family-specific value `earnTransactionType` was derived from — a family `mode`,
   * Solana `model.kind`, or (at broadcast) an `OperationType`. Kept for drill-down and to
   * measure how often the normalization misses.
   */
  rawTransactionType?: string;
  /**
   * Delegation target(s) — validator addresses / staking pool id(s). Public ids, not the
   * human-readable pool name. Read from the transaction at the sign stage; at broadcast only
   * available for families that copy it into the optimistic operation's `extra`.
   */
  validators?: string[];
  isTestnet: boolean;
  isSendMax: boolean;
  dataSource: TransactionDataSource;
};

type FailureLogEvent = {
  status: "failure";
  stage: TransactionStage;
  error: Error;
  errorCategory: ErrorCategory;
  /** Present only when signing succeeded (i.e. broadcast-stage failures). */
  txPayload?: {
    signature: string;
    rawData?: Record<string, unknown>;
  };
} & CommonLogEvent;

type SuccessLogEvent = {
  status: "success";
  stage: TransactionStage.Broadcast;
} & CommonLogEvent;

export type LogEvent = SuccessLogEvent | FailureLogEvent;

/** Injected by each host app to forward events to its analytics sink. */
export type TransactionLogger = (event: LogEvent) => void;

export type { CommonLogEvent, FailureLogEvent, SuccessLogEvent };
