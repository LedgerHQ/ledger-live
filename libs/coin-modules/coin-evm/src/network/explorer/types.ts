import type { MemoNotSupported, Operation } from "@ledgerhq/coin-module-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmConfigInfo } from "../../config";

/** Constant representing no pagination token (end of pagination or first page) */
export const NO_TOKEN = "";

export type ExplorerApi = {
  getOperations: (
    currency: CryptoCurrency,
    address: string,
    fromBlock: number,
    toBlock?: number,
    pagingToken?: string,
    limit?: number,
    order?: "asc" | "desc",
  ) => Promise<{
    lastCoinOperations: Array<Operation<MemoNotSupported>>;
    lastTokenOperations: Array<Operation<MemoNotSupported>>;
    lastNftOperations: Array<Operation<MemoNotSupported>>;
    lastInternalOperations: Array<Operation<MemoNotSupported>>;
    nextPagingToken: string;
  }>;
};

type ExplorerConfig = EvmConfigInfo["explorer"];

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
  type: "etherscan" | "blockscout" | "teloscan" | "klaytnfinder" | "corescan";
} => {
  return ["etherscan", "blockscout", "teloscan", "klaytnfinder", "corescan"].includes(
    explorerConfig?.type as string,
  );
};
