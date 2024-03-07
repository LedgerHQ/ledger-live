import { Operation } from "@ledgerhq/types-live";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmConfig } from "../../config";

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

type ExplorerConfig = EvmConfig["explorer"];

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
