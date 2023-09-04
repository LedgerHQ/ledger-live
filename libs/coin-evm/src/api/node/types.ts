import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency, EthereumLikeInfo } from "@ledgerhq/types-cryptoassets";
import { Transaction as EvmTransaction, FeeData } from "../../types";

export type NodeApi = {
  getTransaction: (
    currency: CryptoCurrency,
    hash: string,
  ) => Promise<{
    hash: string;
    blockHeight: number | undefined;
    blockHash: string | undefined;
    nonce: number;
  }>;
  getCoinBalance: (currency: CryptoCurrency, address: string) => Promise<BigNumber>;
  getTokenBalance: (
    currency: CryptoCurrency,
    address: string,
    contractAddress: string,
  ) => Promise<BigNumber>;
  getTransactionCount: (currency: CryptoCurrency, address: string) => Promise<number>;
  getGasEstimation: (account: Account, transaction: EvmTransaction) => Promise<BigNumber>;
  getFeeData: (currency: CryptoCurrency, transaction: EvmTransaction) => Promise<FeeData>;
  broadcastTransaction: (currency: CryptoCurrency, signedTxHex: string) => Promise<string>;
  getBlockByHeight: (
    currency: CryptoCurrency,
    blockHeight: number | "latest",
  ) => Promise<{ hash: string; height: number; timestamp: number }>;
  getOptimismAdditionalFees: (
    currency: CryptoCurrency,
    transaction: EvmTransaction,
  ) => Promise<BigNumber>;
};

type NodeConfig = EthereumLikeInfo["node"];

/**
 * Type guard
 */
export const isLedgerNodeConfig = (
  nodeConfig: NodeConfig,
): nodeConfig is NodeConfig & { type: "ledger" } => {
  return nodeConfig?.type === "ledger";
};

/**
 * Type guard
 */
export const isExternalNodeConfig = (
  nodeConfig: NodeConfig,
): nodeConfig is NodeConfig & { type: "external" } => {
  return nodeConfig?.type === "external";
};
