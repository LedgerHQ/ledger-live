import BigNumber from "bignumber.js";
import { Account, BroadcastConfig } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Transaction as EvmTransaction, FeeData } from "../../types";
import { EvmConfigInfo } from "../../config";

export type NodeApi = {
  getTransaction: (
    currency: CryptoCurrency,
    hash: string,
  ) => Promise<{
    hash: string;
    blockHeight: number | undefined;
    blockHash: string | undefined;
    nonce: number;
    gasUsed: string;
    gasPrice: string;
    value: string;
    status: number | null;
  }>;
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
  ) => Promise<{ hash: string; height: number; timestamp: number }>;
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
