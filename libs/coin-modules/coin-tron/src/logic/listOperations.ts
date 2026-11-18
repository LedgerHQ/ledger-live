import { Operation, Page } from "@ledgerhq/coin-module-framework/api/index";
import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { TronCoinConfig } from "../config";
import {
  fetchTronAccountTxsEndpointPage,
  fetchTronAccountTxsPage,
  getBlock,
  TxEndpoint,
  TxEndpointPage,
} from "../network";
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
import { TronEmptyPage, TronPageServedTwice } from "../types/errors";
import { aggregateTrc20Transfers } from "./aggregateTrc20Transfers";

// A page is cut only between block timestamps, so a transaction is never split across pages.

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
  const [native, trc20] = await Promise.all([
    skipEmptyLinkedPages(logger, config, "native", firstPages.native, new Set()),
    skipEmptyLinkedPages(logger, config, "trc20", firstPages.trc20, new Set()),
  ]);

  const cursorPageIsEmpty =
    start !== null && native.rawTimestamps.length === 0 && trc20.rawTimestamps.length === 0;
  if (cursorPageIsEmpty) {
    throw new TronEmptyPage(
      `TronGrid returned empty page for cursor ${cursor} — transient failure, retry required`,
    );
  }

  const { txs, next } = await cutPage(logger, config, order, { native, trc20 });
  // A page holds every record of its transactions, so a sum is never split across pages.
  const summedTxs = aggregateTrc20Transfers(txs, address);
  return { items: await toOperations(logger, config, address, summedTxs), next };
}

async function cutPage(
  logger: Logger,
  config: TronCoinConfig,
  order: Order,
  pages: Record<TxEndpoint, TxEndpointPage>,
): Promise<{ txs: TrongridTxInfo[]; next: string | undefined }> {
  const boundary = pageBoundary(order, [pages.native, pages.trc20]);
  if (boundary === undefined) {
    return { txs: mergeEndpoints(order, pages.native.txs, pages.trc20.txs), next: undefined };
  }

  const isBeforeBoundary = (ts: number) => walksBefore(order, ts, boundary);
  if (
    pages.native.rawTimestamps.some(isBeforeBoundary) ||
    pages.trc20.rawTimestamps.some(isBeforeBoundary)
  ) {
    const before = (txs: TrongridTxInfo[]) => txs.filter(tx => isBeforeBoundary(tx.date.getTime()));
    return {
      txs: mergeEndpoints(order, before(pages.native.txs), before(pages.trc20.txs)),
      next: String(boundary),
    };
  }

  const [nativeGroup, trc20Group] = await Promise.all([
    readWholeTimestampGroup(logger, config, "native", pages.native, boundary),
    readWholeTimestampGroup(logger, config, "trc20", pages.trc20, boundary),
  ]);
  return {
    txs: mergeEndpoints(order, nativeGroup.txs, trc20Group.txs),
    next: nativeGroup.hasMore || trc20Group.hasMore ? String(stepPast(order, boundary)) : undefined,
  };
}

async function readWholeTimestampGroup(
  logger: Logger,
  config: TronCoinConfig,
  endpoint: TxEndpoint,
  firstPage: TxEndpointPage,
  timestamp: number,
  followed: Set<string> = new Set(),
): Promise<{ txs: TrongridTxInfo[]; hasMore: boolean }> {
  const txs = firstPage.txs.filter(tx => tx.date.getTime() === timestamp);
  if (firstPage.rawTimestamps.some(ts => ts !== timestamp)) return { txs, hasMore: true };
  if (firstPage.next === undefined) return { txs, hasMore: false };

  const nextPage = await followNext(logger, config, endpoint, firstPage.next, followed);
  const rest = await readWholeTimestampGroup(
    logger,
    config,
    endpoint,
    nextPage,
    timestamp,
    followed,
  );
  return { txs: [...txs, ...rest.txs], hasMore: rest.hasMore };
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
