import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, BroadcastConfig } from "@ledgerhq/types-live";
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
};

export type PrefetchedBlockTransaction = Pick<
  TransactionInfo,
  "hash" | "value" | "from" | "to" | "input"
>;

export type BlockReceiptInfo = Pick<
  TransactionInfo,
  "hash" | "gasUsed" | "gasPrice" | "status" | "erc20Transfers" | "contractAddress"
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
  getTokenAllowance: (
    currency: CryptoCurrency,
    ownerAddress: string,
    contractAddress: string,
    spenderAddress: string,
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
