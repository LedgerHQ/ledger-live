import { Operation } from "@ledgerhq/types-live";
import { CryptoCurrency, EthereumLikeInfo } from "@ledgerhq/types-cryptoassets";

export type ExplorerApi = {
  getLastOperations: (
    currency: CryptoCurrency,
    address: string,
    accountId: string,
    fromBlock: number,
    toBlock?: number,
  ) => Promise<{
    lastCoinOperations: Operation[];
    lastTokenOperations: Operation[];
    lastNftOperations: Operation[];
    lastInternalOperations: Operation[];
  }>;
};

type ExplorerConfig = EthereumLikeInfo["explorer"];

/**
 * Type guard
 */
export const isLedgerExplorerConfig = (
  explorerConfig: ExplorerConfig,
): explorerConfig is ExplorerConfig & { type: "ledger" } => {
  return explorerConfig?.type === "ledger";
};

/**
 * Type guard
 */
export const isEtherscanLikeExplorerConfig = (
  explorerConfig: ExplorerConfig,
): explorerConfig is ExplorerConfig & {
  type: "etherscan" | "blockscout" | "teloscan" | "klaytnfinder";
} => {
  return ["etherscan", "blockscout", "teloscan", "klaytnfinder"].includes(
    explorerConfig?.type as string,
  );
};
