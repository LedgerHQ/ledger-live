import { Operation, Page } from "@ledgerhq/coin-module-framework/api/index";
import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import BigNumber from "bignumber.js";
import type { TronCoinConfig } from "../config";
import {
  fetchTronAccountTxsEndpointPage,
  fetchTronAccountTxsPage,
  getBlock,
  getTransactionById,
  getTransactionInfoById,
  InternalTransferTx,
  TxEndpoint,
  TxEndpointPage,
} from "../network";
import { encode58Check } from "../network/format";
import {
  fromTrongridTxInfoToOperation,
  hasUnresolvedTokenReference,
} from "../network/trongrid/trongrid-adapters";
import { Block } from "../network/types";
import { TrongridTxInfo } from "../types";
import {
  compareTxsByTimestamp,
  Order,
  pageBoundary,
  parseCursor,
  stepPast,
  walksBefore,
} from "./cursor";
import { TronEmptyPage, TronMissingReceipt, TronPageServedTwice } from "../types/errors";
import { aggregateTrc20Transfers } from "./aggregateTrc20Transfers";
import { InternalTransfer, readInternalTransfers } from "./internalTransfers";

// A page is cut only between block timestamps, so a transaction is never split across pages.

const TX_ENDPOINTS: readonly TxEndpoint[] = ["native", "trc20", "internal"];

export type ListOperationsOptions = {
  limit: number;
  minTimestamp: number;
  order: Order;
  cursor?: string;
};

export async function listOperations(
  logger: Logger,
  config: TronCoinConfig,
  address: string,
  options: ListOperationsOptions,
): Promise<Page<Operation>> {
  const { limit, order, cursor } = options;
  const start = parseCursor(cursor);

  const firstPages = await fetchTronAccountTxsPage(logger, config, address, {
    limit,
    minTimestamp: order === "asc" ? (start ?? options.minTimestamp) : options.minTimestamp,
    maxTimestamp: order === "asc" ? undefined : (start ?? undefined),
    order,
  });
  const pages = await mapEndpoints(endpoint =>
    skipEmptyLinkedPages(logger, config, endpoint, firstPages[endpoint], new Set()),
  );

  const cursorPageIsEmpty =
    start !== null && TX_ENDPOINTS.every(endpoint => pages[endpoint].rawTimestamps.length === 0);
  if (cursorPageIsEmpty) {
    throw new TronEmptyPage(
      `TronGrid returned empty page for cursor ${cursor} — transient failure, retry required`,
    );
  }

  const { txs, internalTransferTxs, next } = await cutPage(logger, config, order, pages);
  const summedTxs = aggregateTrc20Transfers(txs, address);
  const internalTxs = await readInternalTransfersOf(logger, config, address, internalTransferTxs);
  // A stable sort: a transaction's internal transfers follow the operations of its timestamp.
  const pageTxs = [...summedTxs, ...internalTxs].sort(compareTxsByTimestamp(order));
  return { items: await toOperations(logger, config, address, pageTxs), next };
}

async function mapEndpoints<T>(
  read: (endpoint: TxEndpoint) => Promise<T>,
): Promise<Record<TxEndpoint, T>> {
  const [native, trc20, internal] = await Promise.all(TX_ENDPOINTS.map(read));
  return { native, trc20, internal };
}

type PageContent = { txs: TrongridTxInfo[]; internalTransferTxs: InternalTransferTx[] };

const keepAll = () => true;

/**
 * The page's records whose timestamp passes `keep`. The internal-transactions endpoint is cut by
 * the same rule as the others, so an internal transfer is listed on the page of the transaction
 * that made it, and only there.
 */
function pageContent(page: TxEndpointPage, keep: (timestamp: number) => boolean): PageContent {
  return {
    txs: page.txs.filter(tx => keep(tx.date.getTime())),
    internalTransferTxs: (page.internalTransferTxs ?? []).filter(tx => keep(tx.date.getTime())),
  };
}

/**
 * The TRX (or TRC10) contracts moved to or from the account, read from the receipts of the
 * transactions the internal-transactions endpoint lists: its records have no block number, and may
 * omit the value they moved. Each value moved gives an operation of its own, under the
 * transaction's hash, with no fee — the transaction's sender already paid for its execution.
 */
async function readInternalTransfersOf(
  logger: Logger,
  config: TronCoinConfig,
  address: string,
  internalTransferTxs: InternalTransferTx[],
): Promise<TrongridTxInfo[]> {
  const txsById = new Map(internalTransferTxs.map(tx => [tx.txID, tx]));
  const perTx = await promiseAllBatched(3, [...txsById.values()], async ({ txID, date }) => {
    const [receipt, tx] = await Promise.all([
      getTransactionInfoById(logger, config, txID),
      getTransactionById(logger, config, txID),
    ]);
    if (!receipt || receipt.blockNumber === undefined || !tx) {
      throw new TronMissingReceipt(`No receipt yet for transaction ${txID}, retry required`);
    }
    // A failed transaction's revert undoes every value its contracts moved.
    if (tx.ret?.[0]?.contractRet !== "SUCCESS") return [];

    const [contract] = tx.raw_data.contract;
    const sender = contract?.parameter.value.owner_address;
    const parent: InternalTransferParent = {
      txID,
      date,
      blockHeight: receipt.blockNumber,
      type:
        contract?.type === "CreateSmartContract" ? "CreateSmartContract" : "TriggerSmartContract",
      ...(sender ? { feesPayer: encode58Check(sender) } : {}),
    };
    return readInternalTransfers(logger, receipt)
      .filter(({ from, to }) => from !== to && (from === address || to === address))
      .map(transfer => toInternalTxInfo(parent, transfer));
  });
  return perTx.flat();
}

type InternalTransferParent = Pick<
  TrongridTxInfo,
  "txID" | "date" | "blockHeight" | "type" | "feesPayer"
>;

function toInternalTxInfo(
  parent: InternalTransferParent,
  { index, from, to, amount, tokenId }: InternalTransfer,
): TrongridTxInfo {
  return {
    ...parent,
    from,
    to,
    value: new BigNumber(amount.toString()),
    fee: new BigNumber(0),
    hasFailed: false,
    internalIndex: index,
    ...(tokenId ? { tokenType: "trc10", tokenId } : {}),
  };
}

async function cutPage(
  logger: Logger,
  config: TronCoinConfig,
  order: Order,
  pages: Record<TxEndpoint, TxEndpointPage>,
): Promise<PageContent & { next: string | undefined }> {
  const merge = (contents: Record<TxEndpoint, PageContent>): PageContent => ({
    txs: mergeEndpoints(order, contents.native.txs, contents.trc20.txs),
    internalTransferTxs: contents.internal.internalTransferTxs,
  });
  const cut = (keep: (timestamp: number) => boolean) =>
    merge({
      native: pageContent(pages.native, keep),
      trc20: pageContent(pages.trc20, keep),
      internal: pageContent(pages.internal, keep),
    });

  const boundary = pageBoundary(
    order,
    TX_ENDPOINTS.map(endpoint => pages[endpoint]),
  );
  if (boundary === undefined) {
    return { ...cut(keepAll), next: undefined };
  }

  const isBeforeBoundary = (ts: number) => walksBefore(order, ts, boundary);
  if (TX_ENDPOINTS.some(endpoint => pages[endpoint].rawTimestamps.some(isBeforeBoundary))) {
    return { ...cut(isBeforeBoundary), next: String(boundary) };
  }

  const groups = await mapEndpoints(endpoint =>
    readWholeTimestampGroup(logger, config, endpoint, pages[endpoint], boundary),
  );
  const hasMore = TX_ENDPOINTS.some(endpoint => groups[endpoint].hasMore);
  return {
    ...merge(groups),
    next: hasMore ? String(stepPast(order, boundary)) : undefined,
  };
}

async function readWholeTimestampGroup(
  logger: Logger,
  config: TronCoinConfig,
  endpoint: TxEndpoint,
  firstPage: TxEndpointPage,
  timestamp: number,
  followed: Set<string> = new Set(),
): Promise<PageContent & { hasMore: boolean }> {
  const group = pageContent(firstPage, ts => ts === timestamp);
  if (firstPage.rawTimestamps.some(ts => ts !== timestamp)) return { ...group, hasMore: true };
  if (firstPage.next === undefined) return { ...group, hasMore: false };

  const nextPage = await followNext(logger, config, endpoint, firstPage.next, followed);
  const rest = await readWholeTimestampGroup(
    logger,
    config,
    endpoint,
    nextPage,
    timestamp,
    followed,
  );
  return {
    txs: [...group.txs, ...rest.txs],
    internalTransferTxs: [...group.internalTransferTxs, ...rest.internalTransferTxs],
    hasMore: rest.hasMore,
  };
}

async function skipEmptyLinkedPages(
  logger: Logger,
  config: TronCoinConfig,
  endpoint: TxEndpoint,
  page: TxEndpointPage,
  followed: Set<string>,
): Promise<TxEndpointPage> {
  if (page.rawTimestamps.length > 0 || page.next === undefined) return page;
  const nextPage = await followNext(logger, config, endpoint, page.next, followed);
  return skipEmptyLinkedPages(logger, config, endpoint, nextPage, followed);
}

function followNext(
  logger: Logger,
  config: TronCoinConfig,
  endpoint: TxEndpoint,
  next: string,
  followed: Set<string>,
): Promise<TxEndpointPage> {
  if (followed.has(next)) {
    throw new TronPageServedTwice(`TronGrid served the ${endpoint} page ${next} twice`);
  }
  followed.add(next);
  return fetchTronAccountTxsEndpointPage(logger, config, endpoint, next);
}

function mergeEndpoints(
  order: Order,
  nativeTxs: TrongridTxInfo[],
  trc20Txs: TrongridTxInfo[],
): TrongridTxInfo[] {
  const trc20TxIds = new Set(trc20Txs.map(tx => tx.txID));
  const nativeTxsWithoutTrc20Record = nativeTxs.filter(tx => !trc20TxIds.has(tx.txID));
  return [...nativeTxsWithoutTrc20Record, ...trc20Txs].sort(compareTxsByTimestamp(order));
}

async function toOperations(
  logger: Logger,
  config: TronCoinConfig,
  address: string,
  txs: TrongridTxInfo[],
): Promise<Operation[]> {
  const emittableTxs = txs.filter(tx => {
    if (!hasUnresolvedTokenReference(tx)) return true;
    logger("tron-error", `dropping ${tx.tokenType} operation without asset reference`, {
      txID: tx.txID,
    });
    return false;
  });

  const blocksByHeight = new Map<number, Block>();
  const uniqueHeights = Array.from(
    new Set(
      emittableTxs.map(tx => tx.blockHeight).filter((h): h is number => typeof h === "number"),
    ),
  );

  await promiseAllBatched(5, uniqueHeights, async height => {
    const fetchedBlock = await getBlock(logger, config, height);
    blocksByHeight.set(height, fetchedBlock);
  });

  return emittableTxs.map(tx => {
    const height = tx.blockHeight;
    if (typeof height !== "number") {
      throw new Error(`Transaction ${tx.txID} has no block height`);
    }
    const txBlock = blocksByHeight.get(height);
    if (!txBlock) {
      throw new Error(`Block ${height} not found for transaction ${tx.txID}`);
    }
    return fromTrongridTxInfoToOperation(tx, txBlock, address);
  });
}
