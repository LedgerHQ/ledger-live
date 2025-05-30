import axios from "axios";
import { getEnv } from "@ledgerhq/live-env";
import { delay } from "@ledgerhq/live-promise";
import { Operation } from "@ledgerhq/types-live";
import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";
import { LedgerExplorerUsedIncorrectly } from "../../errors";
import { LedgerExplorerOperation } from "../../types";
import { getCoinConfig } from "../../config";
import {
  ledgerERC1155EventToOperations,
  ledgerERC20EventToOperations,
  ledgerERC721EventToOperations,
  ledgerInternalTransactionToOperations,
  ledgerOperationToOperations,
} from "../../adapters/index";
import { ExplorerApi, isLedgerExplorerConfig } from "./types";

export const DEFAULT_BATCH_SIZE = 10_000;
export const LEDGER_TIMEOUT = 200; // 200ms between 2 calls
export const DEFAULT_RETRIES_API = 2;

type OperationsRequestParams = {
  explorerId: string;
  address: string;
  fromBlock?: number;
  batchSize: number;
};

/**
 * Request fetching all operations from an address
 * and supporting pagination through tokens.
 */
export async function fetchPaginatedOpsWithRetries(
  params: Required<OperationsRequestParams>,
  paginationToken: string | null = null,
  previousOperations: LedgerExplorerOperation[] = [],
  retries = DEFAULT_RETRIES_API,
): Promise<LedgerExplorerOperation[]> {
  try {
    const {
      data: { data: operationsBatch, token },
    } = await axios.request<{
      data: LedgerExplorerOperation[];
      token: string;
    }>({
      headers: { "X-Ledger-Client-Version": getEnv("LEDGER_CLIENT_VERSION") },
      method: "GET",
      url: `${getEnv("EXPLORER")}/blockchain/v4/${params.explorerId}/address/${params.address}/txs`,
      params: {
        filtering: true,
        from_height: params.fromBlock ?? 0,
        order: "ascending", // Needed to make sure we get transactions after the block height and not before. Order is still descending in the end
        batch_size: params.batchSize,
        token: paginationToken,
      },
    });

    const mergedOperations = [...previousOperations, ...operationsBatch];

    return token
      ? fetchPaginatedOpsWithRetries(params, token, mergedOperations, retries)
      : mergedOperations.sort(
          // sorting DESC order
          (a, b) => new Date(b.block.time).getTime() - new Date(a.block.time).getTime(),
        );
  } catch (e) {
    if (retries) {
      // wait the API timeout before trying again
      await delay(LEDGER_TIMEOUT);
      // decrement with prefix here or it won't work
      return fetchPaginatedOpsWithRetries(params, paginationToken, previousOperations, --retries);
    }
    throw e;
  }
}

/**
 * Returns all operation types from an address
 */
export const getLastOperations: ExplorerApi["getLastOperations"] = async (
  currency,
  address,
  accountId,
  fromBlock,
) => {
  const config = getCoinConfig(currency).info;
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isLedgerExplorerConfig(explorer)) {
    throw new LedgerExplorerUsedIncorrectly(
      `Ledger explorer used incorrectly with currency: ${currency.id}`,
    );
  }

  const ledgerExplorerOps = await fetchPaginatedOpsWithRetries({
    explorerId: explorer.explorerId,
    address,
    fromBlock,
    batchSize: explorer.batchSize ?? DEFAULT_BATCH_SIZE,
  });

  const lastCoinOperations: Operation[] = [];
  const lastTokenOperations: Operation[] = [];
  const lastNftOperations: Operation[] = [];
  const lastInternalOperations: Operation[] = [];

  ledgerExplorerOps.forEach(ledgerOp => {
    const coinOps = ledgerOperationToOperations(accountId, ledgerOp);
    const erc20Ops = ledgerOp.transfer_events.flatMap((event, index) =>
      ledgerERC20EventToOperations(coinOps[0], event, index),
    );
    const erc721Ops =
      isNFTActive(currency) && config.showNfts
        ? ledgerOp.erc721_transfer_events.flatMap((event, index) =>
            ledgerERC721EventToOperations(coinOps[0], event, index),
          )
        : [];
    const erc1155Ops =
      isNFTActive(currency) && config.showNfts
        ? ledgerOp.erc1155_transfer_events.flatMap((event, index) =>
            ledgerERC1155EventToOperations(coinOps[0], event, index),
          )
        : [];
    const internalOps = ledgerOp.actions.flatMap((action, index) =>
      ledgerInternalTransactionToOperations(coinOps[0], action, index),
    );

    lastCoinOperations.push(...coinOps);
    lastTokenOperations.push(...erc20Ops);
    lastNftOperations.push(...erc721Ops);
    lastNftOperations.push(...erc1155Ops);
    lastInternalOperations.push(...internalOps);
  });

  return {
    lastCoinOperations,
    lastTokenOperations,
    lastNftOperations,
    lastInternalOperations,
  };
};

const ledgerExplorerAPI: ExplorerApi = {
  getLastOperations,
};

export default ledgerExplorerAPI;
