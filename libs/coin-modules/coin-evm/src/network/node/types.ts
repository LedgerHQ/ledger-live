import type { BroadcastConfig } from "@ledgerhq/coin-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { EvmConfigInfo } from "../../config";
import { Transaction as EvmTransaction, FeeData } from "../../types";

/**
 * Asset information for token transfers
 */
export type ERC20Asset = {
  type: "erc20";
  /** Token contract address (EIP-55 checksummed) */
  assetReference: string;
};

/**
 * Represents an ERC20 Transfer event extracted from transaction logs
 */
export type ERC20Transfer = {
  asset: ERC20Asset;
  /** Sender address (EIP-55 checksummed) */
  from: string;
  /** Recipient address (EIP-55 checksummed) */
  to: string;
  /** Transfer amount as string (to avoid BigInt serialization issues) */
  value: string;
};

/** An EVM log entry with address, topics and data. */
export type LogWithAddress = {
  address: string;
  topics: readonly string[];
  data: string;
};

/**
 * Call action part of a trace_block trace item (OpenEthereum/Erigon trace API).
 * @see https://www.quicknode.com/docs/ethereum/trace_block
 */
export type TraceBlockCallAction = {
  from: string;
  to: string;
  callType: string;
  value: string;
};

export function isTraceBlockCallAction(
  action: TraceBlockOtherAction,
): action is TraceBlockCallAction {
  return (
    typeof action.from === "string" &&
    typeof action.to === "string" &&
    typeof action.callType === "string" &&
    typeof action.value === "string"
  );
}

/**
 * Other action types (e.g. reward, or other trace_block action shapes).
 * No specific fields are prescribed.
 */
export type TraceBlockOtherAction = Record<string, unknown>;

/**
 * Result part of a trace_block trace item.
 */
export type TraceBlockResult = {
  gasUsed: string;
  output: string;
  error?: string;
};

/**
 * Single trace entry returned by trace_block RPC.
 * When a call reverts, RPC may omit `result` and set top-level `error` (e.g. "Reverted").
 * "reward" type items have no transactionHash/transactionPosition and result is null.
 */
export type TraceBlockItem = {
  action: TraceBlockCallAction | TraceBlockOtherAction;
  /** null when the trace is a reward */
  result?: TraceBlockResult | null;
  /** Present when the trace reverted (no result object). */
  error?: string;
  blockHash: string;
  blockNumber: number;
  transactionHash: string | null;
  transactionPosition: number | null;
  traceAddress: number[];
  subtraces: number;
  type: string;
};

/** A transaction receipt as returned by a RPC node. */
export type TransactionReceipt = {
  transactionHash: string;
  gasUsed: string;
  effectiveGasPrice?: string;
  gasPrice?: string;
  status: string | number | null;
  logs: LogWithAddress[];
};

/**
 * Transaction information returned by NodeApi.getTransaction
 */
export type TransactionInfo = {
  hash: string;
  blockHeight: number | undefined;
  blockHash: string | undefined;
  nonce: number;
  gasUsed: string;
  gasPrice: string;
  value: string;
  status: number | null;
  from: string;
  to: string | undefined;
  /** ERC20 Transfer events extracted from receipt logs */
  erc20Transfers: ERC20Transfer[];
};

export type PrefetchedBlockTransaction = Pick<TransactionInfo, "hash" | "value" | "from" | "to">;

export type BlockReceiptInfo = Pick<
  TransactionInfo,
  "hash" | "gasUsed" | "gasPrice" | "status" | "erc20Transfers"
>;

export type BlockByHeightResult = {
  hash: string;
  height: number;
  timestamp: number;
  parentHash: string;
  transactionHashes?: string[];
  transactions?: PrefetchedBlockTransaction[];
};

export type NodeApi = {
  getTransaction: (currency: CryptoCurrency, hash: string) => Promise<TransactionInfo>;
  getCoinBalance: (currency: CryptoCurrency, address: string) => Promise<BigNumber>;
  getTokenBalance: (
    currency: CryptoCurrency,
    address: string,
    contractAddress: string,
  ) => Promise<BigNumber>;
  getTransactionCount: (currency: CryptoCurrency, address: string) => Promise<number>;
  getGasEstimation: (
    account: Pick<Account, "currency" | "freshAddress">,
    transaction: Pick<EvmTransaction, "amount" | "data" | "recipient">,
  ) => Promise<BigNumber>;
  getFeeData: (
    currency: CryptoCurrency,
    transaction: Pick<EvmTransaction, "type" | "feesStrategy">,
  ) => Promise<FeeData>;
  broadcastTransaction: (
    currency: CryptoCurrency,
    signedTxHex: string,
    broadcastConfig?: BroadcastConfig,
  ) => Promise<string>;
  getBlockByHeight: (
    currency: CryptoCurrency,
    blockHeight: number | "latest",
    prefetchTxs?: boolean,
    // timestamp is in milliseconds
  ) => Promise<BlockByHeightResult>;
  getBlockReceipts?: (
    currency: CryptoCurrency,
    blockHeight: number | "latest",
  ) => Promise<BlockReceiptInfo[]>;
  traceBlock?: (
    currency: CryptoCurrency,
    blockHeight: number | "latest",
  ) => Promise<TraceBlockItem[]>;
  getOptimismAdditionalFees: (currency: CryptoCurrency, transaction: string) => Promise<BigNumber>;
  getScrollAdditionalFees: (currency: CryptoCurrency, transaction: string) => Promise<BigNumber>;
};

type NodeConfig = EvmConfigInfo["node"];

/**
 * Type guard
 */
export const isLedgerNodeConfig = (
  nodeConfig?: NodeConfig,
): nodeConfig is NodeConfig & { type: "ledger" } => {
  return nodeConfig?.type === "ledger";
};

/**
 * Type guard
 */
export const isExternalNodeConfig = (
  nodeConfig?: NodeConfig,
): nodeConfig is NodeConfig & { type: "external" } => {
  return nodeConfig?.type === "external";
};
