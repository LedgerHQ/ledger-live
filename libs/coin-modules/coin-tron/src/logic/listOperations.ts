import { Operation, Page } from "@ledgerhq/coin-module-framework/api/index";
import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import type { Logger } from "@ledgerhq/coin-module-framework/config";
import BigNumber from "bignumber.js";
import type { TronCoinConfig } from "../config";
import {
  fetchTronAccountTxsEndpointPage,
  fetchTronAccountTxsPage,
  getBlock,
  getTransactionInfoById,
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
import { TronEmptyPage, TronMissingReceipt, TronPageServedTwice } from "../types/errors";
import { aggregateTrc20Transfers } from "./aggregateTrc20Transfers";
import { InternalTransfer, readInternalTransfers } from "./internalTransfers";

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

  const { txs, contractCalls, next } = await cutPage(logger, config, order, { native, trc20 });
  const summedTxs = aggregateTrc20Transfers(txs, address);
  const internalTxs = await readInternalTransfersOf(logger, config, address, contractCalls);
  // A stable sort: a transaction's internal transfers follow the operations of its timestamp.
  const pageTxs = [...summedTxs, ...internalTxs].sort(compareTxsByTimestamp(order));
  return { items: await toOperations(logger, config, address, pageTxs), next };
}

type PageContent = { txs: TrongridTxInfo[]; contractCalls: TrongridTxInfo[] };

const keepAll = () => true;

/**
 * The page's records whose timestamp passes `keep`: its transactions, and the contract calls
 * whose receipts are read for internal transfers. Both are cut by the same rule, so an internal
 * transfer is listed on the page of the transaction that made it, and only there.
 */
function pageContent(page: TxEndpointPage, keep: (timestamp: number) => boolean): PageContent {
  return {
    txs: page.txs.filter(tx => keep(tx.date.getTime())),
    contractCalls: (page.contractCalls ?? []).filter(tx => keep(tx.date.getTime())),
  };
}

/**
 * TronGrid's account endpoints list no internal transaction: the TRX (or TRC10) a contract sends
 * to this account, or this account sends as a contract, is only in the receipts of the contract
 * calls. Each one moving value to or from the account gives an operation of its own, under the
 * call's hash, with no fee — the call's fee payer already paid for the whole execution.
 *
 * Only the receipts of calls TronGrid lists for the account are read, so a transfer made by a
 * transaction that otherwise does not involve the account is not found here.
 */
async function readInternalTransfersOf(
  logger: Logger,
  config: TronCoinConfig,
  address: string,
  contractCalls: TrongridTxInfo[],
): Promise<TrongridTxInfo[]> {
  const callsById = new Map(contractCalls.map(call => [call.txID, call]));
  const perCall = await promiseAllBatched(3, [...callsById.values()], async call => {
    const receipt = await getTransactionInfoById(logger, config, call.txID);
    if (!receipt) {
      throw new TronMissingReceipt(`No receipt yet for contract call ${call.txID}, retry required`);
    }
    return readInternalTransfers(logger, receipt)
      .filter(({ from, to }) => from !== to && (from === address || to === address))
      .map(transfer => toInternalTxInfo(call, receipt.blockNumber, transfer));
  });
  return perCall.flat();
}

function toInternalTxInfo(
  call: TrongridTxInfo,
  receiptBlockNumber: number | undefined,
  { index, from, to, amount, tokenId }: InternalTransfer,
): TrongridTxInfo {
  return {
    txID: call.txID,
    date: call.date,
    blockHeight: receiptBlockNumber ?? call.blockHeight,
    // A TRC20 record of the call may be an approval: the transfer itself is a plain call's.
    type: call.type === "CreateSmartContract" ? "CreateSmartContract" : "TriggerSmartContract",
    from,
    to,
    value: new BigNumber(amount.toString()),
    fee: new BigNumber(0),
    hasFailed: false,
    feesPayer: call.feesPayer ?? call.from,
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
  const merge = (native: PageContent, trc20: PageContent): PageContent => ({
    txs: mergeEndpoints(order, native.txs, trc20.txs),
    contractCalls: [...native.contractCalls, ...trc20.contractCalls],
  });

  const boundary = pageBoundary(order, [pages.native, pages.trc20]);
  if (boundary === undefined) {
    return {
      ...merge(pageContent(pages.native, keepAll), pageContent(pages.trc20, keepAll)),
      next: undefined,
    };
  }

  const isBeforeBoundary = (ts: number) => walksBefore(order, ts, boundary);
  if (
    pages.native.rawTimestamps.some(isBeforeBoundary) ||
    pages.trc20.rawTimestamps.some(isBeforeBoundary)
  ) {
    return {
      ...merge(
        pageContent(pages.native, isBeforeBoundary),
        pageContent(pages.trc20, isBeforeBoundary),
      ),
      next: String(boundary),
    };
  }

  const [nativeGroup, trc20Group] = await Promise.all([
    readWholeTimestampGroup(logger, config, "native", pages.native, boundary),
    readWholeTimestampGroup(logger, config, "trc20", pages.trc20, boundary),
  ]);
  return {
    ...merge(nativeGroup, trc20Group),
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
    contractCalls: [...group.contractCalls, ...rest.contractCalls],
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
