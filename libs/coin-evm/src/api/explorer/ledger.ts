import axios from "axios";
import { getEnv } from "@ledgerhq/live-env";
import { delay } from "@ledgerhq/live-promise";
import { Operation } from "@ledgerhq/types-live";
import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";
import { ExplorerApi, isLedgerExplorerConfig } from "./types";
import { LedgerExplorerUsedIncorrectly } from "../../errors";
import { LedgerExplorerOperation } from "../../types";
import {
  ledgerERC20EventToOperations,
  ledgerERC721EventToOperations,
  ledgerERC1155EventToOperations,
  ledgerOperationToOperations,
} from "../../adapters/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export const BATCH_SIZE = 10_000;
export const LEDGER_TIMEOUT = 200; // 200ms between 2 calls
export const DEFAULT_RETRIES_API = 2;

type OperationsRequestParams = {
  explorerId: string;
  address: string;
  fromBlock?: number;
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
        batch_size: BATCH_SIZE,
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
  const { explorer } = currency.ethereumLikeInfo || /* istanbul ignore next */ {};
  if (!isLedgerExplorerConfig(explorer)) {
    throw new LedgerExplorerUsedIncorrectly(
      `Ledger explorer used incorrectly with currency: ${currency.id}`,
    );
  }

  const ledgerExplorerOps = await fetchPaginatedOpsWithRetries({
    explorerId: explorer.explorerId,
    address,
    fromBlock,
  });

  const lastCoinOperations: Operation[] = [];
  const lastTokenOperations: Operation[] = [];
  const lastNftOperations: Operation[] = [];

  ledgerExplorerOps.forEach(ledgerOp => {
    const coinOps = ledgerOperationToOperations(accountId, ledgerOp);
    const erc20Ops = ledgerOp.transfer_events.flatMap(event =>
      ledgerERC20EventToOperations(coinOps[0], event),
    );
    const erc721Ops = isNFTActive(currency)
      ? ledgerOp.erc721_transfer_events.flatMap((event, index) =>
          ledgerERC721EventToOperations(coinOps[0], event, index),
        )
      : [];
    const erc1155Ops = isNFTActive(currency)
      ? ledgerOp.erc1155_transfer_events.flatMap((event, index) =>
          ledgerERC1155EventToOperations(coinOps[0], event, index),
        )
      : [];

    lastCoinOperations.push(...coinOps);
    lastTokenOperations.push(...erc20Ops);
    lastNftOperations.push(...erc721Ops);
    lastNftOperations.push(...erc1155Ops);
  });

  return {
    lastCoinOperations,
    lastTokenOperations,
    lastNftOperations,
  };
};

const getTransactionByHash = async (
  currency: CryptoCurrency,
  transactionHash: string,
): Promise<{ confirmations?: number }> => {
  const { explorer } = currency.ethereumLikeInfo || /* istanbul ignore next */ {};

  if (!isLedgerExplorerConfig(explorer)) {
    throw new LedgerExplorerUsedIncorrectly(
      `Ledger explorer used incorrectly with currency: ${currency.id}`,
    );
  }

  const { data } = await axios.request({
    method: "GET",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${explorer.explorerId}/tx/${transactionHash}`,
  });

  return data;
};

const ledgerExplorerAPI: ExplorerApi = {
  getLastOperations,
  getTransactionByHash,
};

export default ledgerExplorerAPI;
