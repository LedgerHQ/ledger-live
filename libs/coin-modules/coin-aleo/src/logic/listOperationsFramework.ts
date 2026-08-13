import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/types";
import { PRIVATE_TRANSFER_FUNCTIONS } from "../constants";
import { fetchAccountTransactionsFromHeight, fetchAllOwnedRecords } from "../network/utils";
import type { AleoCoinConfig, AleoPrivateRecord } from "../types";
import { lastBlock } from "./lastBlock";
import { enrichPrivateRecords } from "./listPrivateOperations";
import {
  assertCursorMatchesRequest,
  buildOrderedOperations,
  buildResumePoint,
  decodeOperationsCursor,
  encodeOperationsCursor,
  getScannerSyncedHeight,
  resolveHeightWindow,
} from "./listOperationsFramework.helpers";

const DEFAULT_LIMIT = 50;

/**
 * Lists complete public + private operations over a scanner-bounded height range: one operation
 * per `(account, tx)`, both sides merged in the same pass.
 *
 * Stateless by design — nothing is cached between calls. A page reads only its own height window, so
 * resuming does not re-decrypt what earlier pages already covered, and the records that fall outside
 * the window are dropped before the per-record decryption they would otherwise cost.
 */
export async function listOperationsFramework({
  config,
  address,
  options,
  provableId,
  viewKey,
}: {
  config: AleoCoinConfig;
  address: string;
  options: ListOperationsOptions;
  provableId: string;
  viewKey: string;
}): Promise<Page<Operation>> {
  const minHeight = options.minHeight;
  const order = options.order ?? "asc";
  const cursor = decodeOperationsCursor(options.cursor);

  if (cursor) assertCursorMatchesRequest(cursor, minHeight, order);

  const latestBlock = await lastBlock(config);
  // Read on every page, not just the first: it is also what turns a dropped enrollment into
  // AleoProvableIdNotFoundError instead of a bare 4xx surfacing from the records fetch.
  const scannerSyncedHeight = await getScannerSyncedHeight({
    config,
    provableId,
    address,
    latestBlockHeight: latestBlock.height,
  });

  // A cursor pins the ceiling so a paging run stays a consistent snapshot as the scanner advances,
  // but it is still clamped to the chain tip: a stale or hand-crafted cursor must not lift the range
  // above what exists. Re-deriving the ceiling here instead would defeat the pin.
  const maxBlockHeight = Math.min(
    cursor?.maxBlockHeight ?? scannerSyncedHeight,
    latestBlock.height,
  );

  // Only the opening page owns the empty-range rule; on a resume the window legitimately collapses
  // onto a single height that may still hold operations this run has not emitted.
  if (!cursor && maxBlockHeight <= minHeight) {
    return { items: [], next: undefined };
  }

  const { from, to } = resolveHeightWindow(cursor, minHeight, maxBlockHeight);

  if (from > to) {
    return { items: [], next: undefined };
  }

  // The window is enforced here; the bounds handed to the fetches below only keep them from
  // over-fetching, and are not trusted to define the range on their own.
  const isInWindow = (height: number): boolean => height >= from && height <= to;

  const [publicResult, ownedRecords] = await Promise.all([
    fetchAccountTransactionsFromHeight({
      config,
      address,
      fetchAllPages: true,
      minBlockHeight: from,
    }),
    fetchAllOwnedRecords({
      config,
      uuid: provableId,
      start: from,
      // empty programs opts out of the credits.aleo-only filter, so token records are included too
      programs: [],
      functions: [...PRIVATE_TRANSFER_FUNCTIONS],
    }),
  ]);

  const publicTransactions = publicResult.transactions.filter(tx => isInWindow(tx.block_number));
  const publicTxIds = new Set(publicTransactions.map(tx => tx.transaction_id.trim()));

  const ownedRecordTxIds = new Set<string>();
  // Only fully private transfers need decrypting: the rest are completed from their public row.
  const recordsToEnrich: AleoPrivateRecord[] = [];

  for (const record of ownedRecords) {
    if (!isInWindow(record.block_height)) continue;

    const transactionId = record.transaction_id.trim();
    ownedRecordTxIds.add(transactionId);

    if (!publicTxIds.has(transactionId)) recordsToEnrich.push(record);
  }

  const enrichedRecords = await enrichPrivateRecords({
    config,
    viewKey,
    address,
    records: recordsToEnrich,
  });

  const ordered = buildOrderedOperations({
    publicTransactions,
    ownedRecordTxIds,
    privateOnlyRecords: enrichedRecords,
    address,
    order,
  });

  // The window opens on the boundary height, so the operations already emitted there come back in
  // this page's stream. The ordering is total and the range immutable, so they are exactly its first
  // `emitted` rows.
  const emittedBefore = cursor?.resume?.emitted ?? 0;
  const limit = options.limit ?? DEFAULT_LIMIT;
  const items = ordered.slice(emittedBefore, emittedBefore + limit);
  const resume = buildResumePoint(ordered, emittedBefore, items.length);
  const hasMore = emittedBefore + items.length < ordered.length;

  return {
    items,
    next:
      hasMore && resume
        ? encodeOperationsCursor({ minHeight, maxBlockHeight, order, resume })
        : undefined,
  };
}
