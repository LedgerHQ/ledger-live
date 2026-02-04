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
    // timestamp is in milliseconds
  ) => Promise<{
    hash: string;
    height: number;
    timestamp: number;
    parentHash: string;
    transactionHashes?: string[];
  }>;
  getOptimismAdditionalFees: (
    currency: CryptoCurrency,
    transaction: EvmTransaction | string,
  ) => Promise<BigNumber>;
  getScrollAdditionalFees: (
    currency: CryptoCurrency,
    transaction: EvmTransaction | string,
  ) => Promise<BigNumber>;
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
