import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/types";
import { PRIVATE_TRANSFER_FUNCTIONS } from "../constants";
import { fetchAllOwnedRecords, fetchRecordScannerStatus } from "../network/utils";
import type {
  AleoCoinConfig,
  AleoPrivateRecord,
  AleoPublicTransaction,
  EnrichedPrivateRecord,
} from "../types";
import { lastBlock } from "./lastBlock";
import { listPublicOperations } from "./listPublicOperations";
import { enrichPrivateRecords } from "./listPrivateOperations";
import {
  assertCursorMatchesRequest,
  buildResumePoint,
  decodeOperationsCursor,
  encodeOperationsCursor,
  resolveHeightWindow,
} from "./operationsCursor";
import { toCoinFrameworkPrivateOperation, toMergedOperation } from "./utils";

const DEFAULT_LIMIT = 50;

/**
 * Resolves the height the record scanner is complete through. Operations above it are withheld
 * rather than returned public-only (ADR-042 completeness ceiling).
 *
 * `synced_up_to` ships with LIVE-34092. Until then a fully-synced scanner is assumed complete
 * through the chain tip, and a lagging one yields 0 (empty page) rather than a partial range.
 */
async function getScannerSyncedHeight(
  config: AleoCoinConfig,
  provableId: string,
  latestBlockHeight: number,
): Promise<number> {
  const status = await fetchRecordScannerStatus(config, provableId);

  if (typeof status.synced_up_to === "number") return status.synced_up_to;

  return status.synced ? latestBlockHeight : 0;
}

/** One operation per `(account, tx)`, ordered totally so the result is reproducible across calls. */
function buildOrderedOperations({
  publicTransactions,
  ownedRecordTxIds,
  privateOnlyRecords,
  address,
  order,
}: {
  publicTransactions: AleoPublicTransaction[];
  ownedRecordTxIds: Set<string>;
  privateOnlyRecords: (EnrichedPrivateRecord | null)[];
  address: string;
  order: "asc" | "desc";
}): Operation[] {
  const operations = publicTransactions.map(rawTx =>
    toMergedOperation(rawTx, address, ownedRecordTxIds.has(rawTx.transaction_id.trim())),
  );

  for (const record of privateOnlyRecords) {
    if (record) operations.push(toCoinFrameworkPrivateOperation(record, address));
  }

  const direction = order === "asc" ? 1 : -1;

  // Tie-break on hash so the ordering is total.
  return operations.sort(
    (a, b) =>
      direction * (a.tx.block.height - b.tx.block.height || a.tx.hash.localeCompare(b.tx.hash)),
  );
}

/**
 * Lists complete public + private operations over a scanner-bounded height range: one operation
 * per `(account, tx)`, both sides merged in the same pass.
 *
 * Stateless by design — nothing is cached between calls. Records outside the page's height window
 * are dropped before the per-record decryption, which is the expensive half.
 */
export async function listOperations({
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
  // Read on every page so a dropped enrollment surfaces as AleoApiConfigurationResetError rather
  // than a bare 4xx from the records fetch.
  const scannerSyncedHeight = await getScannerSyncedHeight(config, provableId, latestBlock.height);

  // A cursor pins the ceiling so a paging run stays a consistent snapshot as the scanner advances,
  // still clamped to the tip so a stale or hand-crafted cursor cannot lift the range above what exists.
  const maxBlockHeight = Math.min(
    cursor?.maxBlockHeight ?? scannerSyncedHeight,
    latestBlock.height,
  );

  // Only the opening page owns the empty-range rule: on a resume the window legitimately collapses
  // onto a single height that may still hold operations this run has not emitted.
  if (!cursor && maxBlockHeight <= minHeight) {
    return { items: [], next: undefined };
  }

  const { from, to } = resolveHeightWindow(cursor, minHeight, maxBlockHeight);

  if (from > to) {
    return { items: [], next: undefined };
  }

  // The window is enforced here; the bounds handed to the fetches below only limit over-fetching.
  const isInWindow = (height: number): boolean => height >= from && height <= to;

  const [publicResult, ownedRecords] = await Promise.all([
    listPublicOperations({ config, address, minBlockHeight: from }),
    fetchAllOwnedRecords({
      config,
      uuid: provableId,
      start: from,
      // empty opts out of the credits.aleo-only filter, so token records are included too
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

  // The window opens on the boundary height, so operations already emitted there come back in this
  // page's stream. Ordering is total and the range immutable, so they are exactly its first rows.
  const emittedBefore = cursor?.resume?.emitted ?? 0;
  const limit = Math.max(options.limit ?? DEFAULT_LIMIT, 1);
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
