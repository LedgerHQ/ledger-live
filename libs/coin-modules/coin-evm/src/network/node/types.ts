import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import BigNumber from "bignumber.js";
import { BlockFinalizationTag, EvmConfigInfo } from "../../config";
import { FeeData } from "../../types";

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
  action: Record<string, unknown>,
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
  blockHash?: string;
  blockNumber: number;
  transactionHash: string | null;
  transactionPosition: number | null;
  traceAddress: number[];
  subtraces: number;
  type: string;
};

/** Type guard for {@link TraceBlockItem} (Erigon `trace_block` and Geth adapter output). */
export function isTraceBlockItem(value: unknown): value is TraceBlockItem {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  if (!o.action || typeof o.action !== "object" || o.action === null) return false;
  const action = o.action as Record<string, unknown>;
  if (o.error !== undefined && typeof o.error !== "string") return false;

  const result = o.result;
  const resultOk =
    result === undefined ||
    result === null ||
    (typeof result === "object" &&
      ((result as Record<string, unknown>).error === undefined ||
        typeof (result as Record<string, unknown>).error === "string"));
  const validCall = typeof o.transactionHash === "string" && resultOk;

  return !isTraceBlockCallAction(action) || validCall;
}

/** A transaction receipt as returned by a RPC node. */
export type TransactionReceipt = {
  transactionHash: string;
  gasUsed: string;
  effectiveGasPrice?: string;
  gasPrice?: string;
  status: string | number | null;
  logs: LogWithAddress[];
  /** Tx envelope type per EIP-2718, hex-prefixed (e.g. "0x2" EIP-1559). */
  type?: string;
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
  value: string | bigint; // can be returned as bigint by ethers prefetched txs, or string in raw payloads
  status: number | null;
  from: string;
  to: string | undefined;
  /** Calldata / init code (hex), when available from the node */
  input?: string;
  /** Created contract address (contract-creation txs), when known from the receipt or explorer */
  contractAddress?: string;
  /** ERC20 Transfer events extracted from receipt logs */
  erc20Transfers: ERC20Transfer[];
  /** Tx envelope type per EIP-2718 (decimal), e.g. 2 for EIP-1559. */
  type?: number;
};

export type PrefetchedBlockTransaction = Pick<
  TransactionInfo,
  "hash" | "value" | "from" | "to" | "input" | "gasPrice"
>;

export type BlockReceiptInfo = Pick<
  TransactionInfo,
  "hash" | "gasUsed" | "gasPrice" | "status" | "erc20Transfers" | "contractAddress" | "type"
>;

export type BlockByHeightResult = {
  hash: string;
  height: number;
  timestamp: number;
  parentHash: string;
  transactionHashes?: string[];
  transactions?: PrefetchedBlockTransaction[];
};

export type EvmCallParams = {
  to: string;
  data: string;
  block?: string | number;
};

export type NodeApi = {
  call: (currencyId: string, params: EvmCallParams) => Promise<string>;
  getTransaction: (currencyId: string, hash: string) => Promise<TransactionInfo>;
  getCoinBalance: (currencyId: string, address: string) => Promise<BigNumber>;
  getTokenBalance: (
    currencyId: string,
    address: string,
    contractAddress: string,
  ) => Promise<BigNumber>;
  getTokenAllowance: (
    currencyId: string,
    ownerAddress: string,
    contractAddress: string,
    spenderAddress: string,
  ) => Promise<BigNumber>;
  getTransactionCount: (currencyId: string, address: string) => Promise<number>;
  getGasEstimation: (
    currencyId: string,
    address: string,
    transaction: { amount: BigNumber; data?: Buffer | null | undefined; recipient: string },
  ) => Promise<BigNumber>;
  getFeeData: (
    config: EvmConfigInfo,
    currencyId: string,
    transaction: { type?: number | undefined; feesStrategy?: string | null | undefined },
  ) => Promise<FeeData>;
  broadcastTransaction: (
    currencyId: string,
    signedTxHex: string,
    broadcastConfig?: BroadcastConfig,
  ) => Promise<string>;
  getBlockByHeight: (
    currencyId: string,
    blockHeight: number | BlockFinalizationTag,
    prefetchTxs?: boolean,
    // timestamp is in milliseconds
  ) => Promise<BlockByHeightResult>;
  getBlockReceipts?: (
    currencyId: string,
    blockHeight: number | "latest",
  ) => Promise<BlockReceiptInfo[]>;
  traceBlockErigon?: (
    currencyId: string,
    blockHeight: number | "latest",
  ) => Promise<TraceBlockItem[]>;
  traceBlockGeth?: (currencyId: string, blockHeight: number) => Promise<TraceBlockItem[]>;
  getOptimismAdditionalFees: (currencyId: string, transaction: string) => Promise<BigNumber>;
  getScrollAdditionalFees: (currencyId: string, transaction: string) => Promise<BigNumber>;
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
