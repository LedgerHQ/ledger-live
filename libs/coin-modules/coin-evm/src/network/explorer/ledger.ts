import type { MemoNotSupported, Operation } from "@ledgerhq/coin-module-framework/api/types";
import { delay } from "@ledgerhq/coin-module-framework/promises";
import axios from "axios";
import {
  ledgerERC1155EventToOperations,
  ledgerERC20EventToOperations,
  ledgerERC721EventToOperations,
  ledgerInternalTransactionToOperations,
  ledgerOperationToOperations,
} from "../../adapters/index";
import { DEFAULT_LEDGER_EXPLORER_URI } from "../../config";
import { LedgerExplorerUsedIncorrectly } from "../../errors";
import { LedgerExplorerOperation } from "../../types";
import { ExplorerApi, isLedgerExplorerConfig, NO_TOKEN } from "./types";
import { nftEnabled } from "../../utils";

export const DEFAULT_BATCH_SIZE = 10_000;
export const LEDGER_TIMEOUT = 200; // 200ms between 2 calls
export const DEFAULT_RETRIES_API = 2;

type OperationsRequestParams = {
  explorerId: string;
  address: string;
  fromBlock?: number;
  batchSize: number;
};

/** Both default to what the env used to supply, so the previous call shape keeps working. */
type LedgerExplorerSettings = {
  explorerUri?: string | undefined;
  clientVersion?: string | undefined;
};

/**
 * Request fetching all operations from an address
 * and supporting pagination through tokens.
 */
export async function fetchPaginatedOpsWithRetries(
  params: Required<OperationsRequestParams> & LedgerExplorerSettings,
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
      ...(params.clientVersion
        ? { headers: { "X-Ledger-Client-Version": params.clientVersion } }
        : {}),
      method: "GET",
      url: `${params.explorerUri ?? DEFAULT_LEDGER_EXPLORER_URI}/blockchain/v4/${params.explorerId}/address/${params.address}/txs`,
      params: {
        filtering: true,
        from_height: params.fromBlock ?? 0,
        order: "ascending", // Needed to make sure we get transactions after the block height and not before. Order is still descending in the end
        batch_size: params.batchSize,
        token: paginationToken,
      },
    });

    previousOperations.push(...operationsBatch);

    return token
      ? fetchPaginatedOpsWithRetries(params, token, previousOperations, retries)
      : previousOperations.sort(
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
 *
 * Note: Ledger explorer fetches all pages recursively internally,
 * so pagination parameters are ignored and nextPagingToken is always empty.
 * Pagination may be supported in the future.
 */
export const getOperations: ExplorerApi["getOperations"] = async (
  config,
  currencyId,
  address,
  fromBlock,
) => {
  const { explorer } = config || /* istanbul ignore next */ {};
  if (!isLedgerExplorerConfig(explorer)) {
    throw new LedgerExplorerUsedIncorrectly(
      `Ledger explorer used incorrectly with currency: ${currencyId}`,
    );
  }

  const ledgerExplorerOps = await fetchPaginatedOpsWithRetries({
    explorerUri: config.ledgerExplorerUri,
    clientVersion: config.ledgerClientVersion,
    explorerId: explorer.explorerId,
    address,
    fromBlock,
    batchSize: explorer.batchSize ?? DEFAULT_BATCH_SIZE,
  });

  const lastCoinOperations: Array<Operation<MemoNotSupported>> = [];
  const lastTokenOperations: Array<Operation<MemoNotSupported>> = [];
  const lastNftOperations: Array<Operation<MemoNotSupported>> = [];
  const lastInternalOperations: Array<Operation<MemoNotSupported>> = [];

  // Drop ERC20 Transfer events on contracts that mirror the native asset
  const nativeContractsSet = new Set((config.nativeContracts ?? []).map(c => c.toLowerCase()));
  const isNativeContract = (contract: string): boolean =>
    nativeContractsSet.has(contract.toLowerCase());

  for (const ledgerOp of ledgerExplorerOps) {
    const coinOps = ledgerOperationToOperations(address, currencyId, ledgerOp);

    const erc20TransferEvents =
      nativeContractsSet.size === 0
        ? ledgerOp.transfer_events
        : ledgerOp.transfer_events.filter(event => !isNativeContract(event.contract));

    const erc20Ops = erc20TransferEvents.flatMap((event, index) =>
      ledgerERC20EventToOperations(address, coinOps[0], event, index),
    );
    const erc721Ops =
      nftEnabled(currencyId) && config.supportedTokens?.includes("erc721")
        ? ledgerOp.erc721_transfer_events.flatMap((event, index) =>
            ledgerERC721EventToOperations(address, coinOps[0], event, index),
          )
        : [];
    const erc1155Ops =
      nftEnabled(currencyId) && config.supportedTokens?.includes("erc1155")
        ? ledgerOp.erc1155_transfer_events.flatMap((event, index) =>
            ledgerERC1155EventToOperations(address, coinOps[0], event, index),
          )
        : [];
    const internalOps = ledgerOp.actions.flatMap((action, index) =>
      ledgerInternalTransactionToOperations(address, coinOps[0], action, index),
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
