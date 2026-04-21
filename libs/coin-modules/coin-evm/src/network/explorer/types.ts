import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import { EvmConfigInfo } from "../../config";

/** Constant representing no pagination token (end of pagination or first page) */
export const NO_TOKEN = "";

export type ExplorerApi = {
  getOperations: (
    currency: CryptoCurrency,
    address: string,
    accountId: string,
    fromBlock: number,
    toBlock?: number,
    pagingToken?: string,
    limit?: number,
    order?: "asc" | "desc",
  ) => Promise<{
    lastCoinOperations: Operation[];
    lastTokenOperations: Operation[];
    lastNftOperations: Operation[];
    lastInternalOperations: Operation[];
    nextPagingToken: string;
  }>;
};

type ExplorerConfig = EvmConfigInfo["explorer"];
type EtherscanLikeExplorerConfig = Extract<
  ExplorerConfig,
  { type: "etherscan" | "blockscout" | "teloscan" | "klaytnfinder" | "corescan" }
>;

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
): explorerConfig is EtherscanLikeExplorerConfig => {
  switch (explorerConfig?.type) {
    case "etherscan":
    case "blockscout":
    case "teloscan":
    case "klaytnfinder":
    case "corescan":
      return true;
    default:
      return false;
  }
};
