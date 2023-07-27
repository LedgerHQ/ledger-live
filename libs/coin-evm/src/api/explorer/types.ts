import { Operation } from "@ledgerhq/types-live";
import { CryptoCurrency, EthereumLikeInfo } from "@ledgerhq/types-cryptoassets";

type ExplorerBasicRequest = (
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  fromBlock: number,
  toBlock?: number,
) => Promise<Operation[]>;

export type ExplorerApi = {
  getLastOperations: (...args: Parameters<ExplorerBasicRequest>) => Promise<{
    lastCoinOperations: Operation[];
    lastTokenOperations: Operation[];
    lastNftOperations: Operation[];
  }>;

  // For now every other exported function should be considered as internal
  // methods as they're unecessary to the synchronization it self.
  // This can be updated with new sync requirements.
  // & { [key in
  //   | "getLastCoinOperations"
  //   | "getLastTokenOperations"
  //   | "getLastERC721Operations"
  //   | "getLastERC1155Operations"
  //   | "getLastNftOperations"]: ExplorerBasicRequest; }
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
): explorerConfig is ExplorerConfig & { type: "etherscan" | "blockscout" | "teloscan" } => {
  return ["etherscan", "blockscout", "teloscan"].includes(explorerConfig?.type as string);
};
