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
  serializeCursor,
  stepPast,
  walksBefore,
} from "./cursor";
import { TronEmptyPage, TronPageServedTwice } from "../types/errors";

// Native and TRC20 records come from two TronGrid endpoints paged independently. A page is cut
// only between timestamps: all records of one transaction share its block timestamp, so a
// transaction, with its native record and all its TRC20 records, is always emitted on one page.
// The cursor is the timestamp the next page starts at, inclusive (see `pageBoundary`).

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

  const { native, trc20 } = await fetchTronAccountTxsPage(logger, config, address, {
    limit,
    minTimestamp: order === "asc" ? (start ?? options.minTimestamp) : options.minTimestamp,
    maxTimestamp: order === "asc" ? undefined : (start ?? undefined),
    order,
  });

  // A cursor is only issued over records TronGrid has already returned, so none at all is a
  // transient TronGrid failure, not an end of history.
  if (start !== null && native.timestamps.length === 0 && trc20.timestamps.length === 0) {
    throw new TronEmptyPage(
      `TronGrid returned empty page for cursor ${cursor} — transient failure, retry required`,
    );
  }

  const { txs, next } = await cutPage(logger, config, order, { native, trc20 });
  return { items: await toOperations(logger, config, address, txs), next };
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
    pages.native.timestamps.some(isBeforeBoundary) ||
    pages.trc20.timestamps.some(isBeforeBoundary)
  ) {
    const before = (txs: TrongridTxInfo[]) => txs.filter(tx => isBeforeBoundary(tx.date.getTime()));
    return {
      txs: mergeEndpoints(order, before(pages.native.txs), before(pages.trc20.txs)),
      next: serializeCursor(boundary),
    };
  }

  // The page holds nothing before the boundary group: emit that group whole, however many pages
  // it spans, and move past it.
  const [nativeGroup, trc20Group] = await Promise.all([
    readGroup(logger, config, "native", pages.native, boundary),
    readGroup(logger, config, "trc20", pages.trc20, boundary),
  ]);
  return {
    txs: mergeEndpoints(order, nativeGroup.txs, trc20Group.txs),
    next:
      nativeGroup.hasMore || trc20Group.hasMore
        ? serializeCursor(stepPast(order, boundary))
        : undefined,
  };
}

/**
 * Every record of `endpoint` at `timestamp`, following TronGrid's `links.next` (the fingerprint)
 * while pages hold nothing else. `hasMore` is true only when a later record was actually seen: a
 * full last page still carries a `next` that leads to an empty page.
 */
async function readGroup(
  logger: Logger,
  config: TronCoinConfig,
  endpoint: TxEndpoint,
  firstPage: TxEndpointPage,
  timestamp: number,
): Promise<{ txs: TrongridTxInfo[]; hasMore: boolean }> {
  const txs: TrongridTxInfo[] = [];
  const followed = new Set<string>();
  let page = firstPage;
  for (;;) {
    txs.push(...page.txs.filter(tx => tx.date.getTime() === timestamp));
    if (page.timestamps.some(ts => ts !== timestamp)) return { txs, hasMore: true };
    if (page.next === undefined || page.timestamps.length === 0) return { txs, hasMore: false };
    if (followed.has(page.next)) {
      throw new TronPageServedTwice(`TronGrid served the ${endpoint} page ${page.next} twice`);
    }
    followed.add(page.next);
    page = await fetchTronAccountTxsEndpointPage(logger, config, endpoint, page.next);
  }
}

/**
 * One list in walk order. A transaction returned by both endpoints keeps only its TRC20 records,
 * which carry the token transfer; TRC20 records are never merged with each other here.
 */
function mergeEndpoints(
  order: Order,
  nativeTxs: TrongridTxInfo[],
  trc20Txs: TrongridTxInfo[],
): TrongridTxInfo[] {
  const trc20TxIds = new Set(trc20Txs.map(tx => tx.txID));
  return [...nativeTxs.filter(tx => !trc20TxIds.has(tx.txID)), ...trc20Txs].sort(
    compareTxsByTimestamp(order),
  );
}

async function toOperations(
  logger: Logger,
  config: TronCoinConfig,
  address: string,
  txs: TrongridTxInfo[],
): Promise<Operation[]> {
  // A token operation whose contract address could not be resolved is dropped: an asset with a
  // `trc10`/`trc20` type and no `assetReference` is unidentifiable for consumers (and fatal for
  // some), and re-typing it as native would report a token amount as TRX. Dropping happens after
  // the page is cut, so pagination still advances over the transaction, but before the blocks are
  // fetched, so a page of only-unresolvable transactions costs no block request.
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
