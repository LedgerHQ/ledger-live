import { isNFTActive } from "@ledgerhq/ledger-wallet-framework/nft/support";
import { getEnv } from "@ledgerhq/live-env";
import { delay } from "@ledgerhq/live-promise";
import { Operation } from "@ledgerhq/types-live";
import axios from "axios";
import {
  ledgerERC1155EventToOperations,
  ledgerERC20EventToOperations,
  ledgerERC721EventToOperations,
  ledgerInternalTransactionToOperations,
  ledgerOperationToOperations,
} from "../../adapters/index";
import { getCoinConfig } from "../../config";
import { LedgerExplorerUsedIncorrectly } from "../../errors";
import { LedgerExplorerOperation } from "../../types";
import { ExplorerApi, isLedgerExplorerConfig, NO_TOKEN } from "./types";

export const DEFAULT_BATCH_SIZE = 10_000;
export const LEDGER_TIMEOUT = 200; // 200ms between 2 calls
export const DEFAULT_RETRIES_API = 2;
export const REQUEST_TIMEOUT_MS = 30_000; // 30s hard cap per HTTP request

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
      timeout: REQUEST_TIMEOUT_MS,
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
 * Fetch operations until `limit` is reached. The server enforces its own page
 * size so a single page may return fewer items than requested; we walk the
 * pagination token until we have at least `limit` ops or run out of pages.
 */
async function fetchUpToLimitWithRetries(
  params: Required<OperationsRequestParams>,
  limit: number,
  retries = DEFAULT_RETRIES_API,
): Promise<LedgerExplorerOperation[]> {
  let collected: LedgerExplorerOperation[] = [];
  let paginationToken: string | null = null;
  while (collected.length < limit) {
    const page = await fetchOnePageWithRetries(params, paginationToken, retries);
    collected = collected.concat(page.operations);
    if (!page.token) break;
    paginationToken = page.token;
  }
  return collected
    .slice(0, limit)
    .sort((a, b) => new Date(b.block.time).getTime() - new Date(a.block.time).getTime());
}

async function fetchOnePageWithRetries(
  params: Required<OperationsRequestParams>,
  paginationToken: string | null,
  retries: number,
): Promise<{ operations: LedgerExplorerOperation[]; token: string }> {
  try {
    const {
      data: { data: operations, token },
    } = await axios.request<{
      data: LedgerExplorerOperation[];
      token: string;
    }>({
      timeout: REQUEST_TIMEOUT_MS,
      headers: { "X-Ledger-Client-Version": getEnv("LEDGER_CLIENT_VERSION") },
      method: "GET",
      url: `${getEnv("EXPLORER")}/blockchain/v4/${params.explorerId}/address/${params.address}/txs`,
      params: {
        filtering: true,
        from_height: params.fromBlock ?? 0,
        order: "ascending",
        batch_size: params.batchSize,
        token: paginationToken,
      },
    });
    return { operations, token };
  } catch (e) {
    if (retries) {
      await delay(LEDGER_TIMEOUT);
      return fetchOnePageWithRetries(params, paginationToken, retries - 1);
    }
    throw e;
  }
}

/**
 * Returns all operation types from an address.
 *
 * When `limit` is provided, only one page sized to `limit` is fetched
 * (no recursive pagination). Useful for cheap existence probes.
 * Otherwise all pages are walked through pagination tokens.
 */
export const getOperations: ExplorerApi["getOperations"] = async (
  currency,
  address,
  accountId,
  fromBlock,
  _toBlock,
  _pagingToken,
  limit,
) => {
  const config = getCoinConfig(currency.id).info;
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isLedgerExplorerConfig(explorer)) {
    throw new LedgerExplorerUsedIncorrectly(
      `Ledger explorer used incorrectly with currency: ${currency.id}`,
    );
  }

  const batchSize = explorer.batchSize ?? DEFAULT_BATCH_SIZE;
  const retries = explorer.retries ?? DEFAULT_RETRIES_API;
  const ledgerExplorerOps =
    limit !== undefined
      ? await fetchUpToLimitWithRetries(
          { explorerId: explorer.explorerId, address, fromBlock, batchSize },
          limit,
          retries,
        )
      : await fetchPaginatedOpsWithRetries(
          {
            explorerId: explorer.explorerId,
            address,
            fromBlock,
            batchSize,
          },
          null,
          [],
          retries,
        );

  const lastCoinOperations: Operation[] = [];
  const lastTokenOperations: Operation[] = [];
  const lastNftOperations: Operation[] = [];
  const lastInternalOperations: Operation[] = [];

  for (const ledgerOp of ledgerExplorerOps) {
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
  }

  return {
    lastCoinOperations,
    lastTokenOperations,
    lastNftOperations,
    lastInternalOperations,
    nextPagingToken: NO_TOKEN, // Ledger explorer fetches all pages internally
  };
};

const ledgerExplorerAPI: ExplorerApi = {
  getOperations,
};

export default ledgerExplorerAPI;
