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
import { listPublicOperationsPage } from "./listPublicOperations";
import { enrichPrivateRecords } from "./listPrivateOperations";
import {
  assertCursorMatchesRequest,
  buildResumePoint,
  compareOperations,
  decodeOperationsCursor,
  dropThroughResumePoint,
  encodeOperationsCursor,
  resolveHeightWindow,
} from "./listOperations.helpers";
import { toCoinFrameworkPrivateOperation, toMergedOperation } from "./utils";

const DEFAULT_LIMIT = 50;

// Ceiling for the widening retry below, so a pathologically dense block degrades to one large fetch
// rather than an unbounded walk.
const MAX_TARGET_TRANSACTIONS = 2000;

/**
 * Resolves the height the record scanner is complete through. Operations above it are withheld
 * rather than returned public-only (ADR-042 completeness ceiling).
 *
 * `synced_up_to` ships with LIVE-34092. Until then the height is unknown, and an unknown ceiling
 * yields 0 (empty page) rather than a guessed range — `synced: true` says nothing about how far the
 * scanner got, so treating it as the chain tip would claim completeness the scanner never reported.
 */
async function getScannerSyncedHeight(config: AleoCoinConfig, provableId: string): Promise<number> {
  const status = await fetchRecordScannerStatus(config, provableId);

  return typeof status.synced_up_to === "number" ? status.synced_up_to : 0;
}

/**
 * Which of a transaction's owned records represents it. Ordered by output index so the choice does
 * not depend on the order the scanner happened to page them in — the resume point counts operations,
 * so an unstable pick would shift the paging boundary between calls.
 */
function isEarlierOutput(candidate: AleoPrivateRecord, current: AleoPrivateRecord): boolean {
  if (candidate.output_index !== current.output_index) {
    return candidate.output_index < current.output_index;
  }

  return candidate.commitment < current.commitment;
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

  return operations.sort((a, b) =>
    compareOperations(
      { block: a.tx.block.height, transactionId: a.tx.hash },
      { block: b.tx.block.height, transactionId: b.tx.hash },
      order,
    ),
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
  const scannerSyncedHeight = await getScannerSyncedHeight(config, provableId);

  // A cursor pins the ceiling so a paging run stays a consistent snapshot as the scanner advances.
  const maxBlockHeight = Math.min(
    cursor?.maxBlockHeight ?? scannerSyncedHeight,
    latestBlock.height,
  );

  // Only the opening page owns the empty-range rule: on a resume the window legitimately collapses
  // onto a single height that may still hold operations this run has not emitted.
  //
  // `minHeight` is inclusive per the framework contract, so a watermark sitting exactly on it still
  // has a block worth reading. The spec's exclusive `lo` is about the cursor position, which the
  // resume point already handles.
  if (!cursor && maxBlockHeight < minHeight) {
    return { items: [], next: undefined };
  }

  const { from, to } = resolveHeightWindow(cursor, minHeight, maxBlockHeight);

  if (from > to) {
    return { items: [], next: undefined };
  }

  const limit = Math.max(options.limit ?? DEFAULT_LIMIT, 1);

  // Started alongside the first public fetch and awaited by every attempt: the record endpoint is
  // bulk-paged and takes no ceiling, so a widening retry reuses the same result rather than refetching.
  const ownedRecordsPromise = fetchAllOwnedRecords({
    config,
    uuid: provableId,
    start: from,
    // empty opts out of the credits.aleo-only filter, so token records are included too
    programs: [],
    functions: [...PRIVATE_TRANSFER_FUNCTIONS],
  });

  async function collectPage(
    targetTransactions: number,
  ): Promise<{ items: Operation[]; hasMore: boolean }> {
    const [publicPage, ownedRecords] = await Promise.all([
      listPublicOperationsPage({
        config,
        address,
        minBlockHeight: from,
        startBlock: order === "asc" ? from : to,
        targetTransactions,
        order,
      }),
      ownedRecordsPromise,
    ]);

    // A bounded public stream can only vouch for the range it actually reached. Merging private
    // operations past that point would emit them ahead of the public rows sharing their heights, and
    // the next page would then repeat those rows.
    const heights = publicPage.transactions.map(tx => tx.block_number);
    const windowFrom =
      publicPage.complete || order === "asc" ? from : Math.max(from, Math.min(...heights));
    const windowTo =
      publicPage.complete || order === "desc" ? to : Math.min(to, Math.max(...heights));
    const isInWindow = (height: number): boolean => height >= windowFrom && height <= windowTo;

    const publicTransactions = publicPage.transactions.filter(tx => isInWindow(tx.block_number));
    const publicTxIds = new Set(publicTransactions.map(tx => tx.transaction_id.trim()));

    const ownedRecordTxIds = new Set<string>();
    // Only fully private transfers need decrypting: the rest are completed from their public row.
    // Keyed by transaction so a transaction producing several owned records — a private self-transfer
    // owns both the output and the change — still yields exactly one operation (ADR-042 invariant).
    const recordsToEnrich = new Map<string, AleoPrivateRecord>();

    for (const record of ownedRecords) {
      if (!isInWindow(record.block_height)) continue;

      const transactionId = record.transaction_id.trim();
      ownedRecordTxIds.add(transactionId);
      if (publicTxIds.has(transactionId)) continue;

      const current = recordsToEnrich.get(transactionId);
      if (!current || isEarlierOutput(record, current)) {
        recordsToEnrich.set(transactionId, record);
      }
    }

    const enrichedRecords = await enrichPrivateRecords({
      config,
      viewKey,
      address,
      records: [...recordsToEnrich.values()],
    });

    const ordered = buildOrderedOperations({
      publicTransactions,
      ownedRecordTxIds,
      privateOnlyRecords: enrichedRecords,
      address,
      order,
    });

    return {
      // The window reopens on the resume block, so operations already emitted from it come back in
      // this stream. Ordering is total, so they are exactly the rows at or before the resume point.
      items: dropThroughResumePoint(ordered, cursor?.resume, order),
      hasMore: !publicPage.complete,
    };
  }

  let targetTransactions = limit;
  let page = await collectPage(targetTransactions);

  // A resume block holding more transactions than the fetch asked for yields a page whose rows were
  // all emitted already — and a cursor that has not moved. Widen until the block clears, rather than
  // hand back an empty page that would end the walk early or spin on the same cursor.
  while (page.items.length === 0 && page.hasMore && targetTransactions < MAX_TARGET_TRANSACTIONS) {
    targetTransactions = Math.min(targetTransactions * 4, MAX_TARGET_TRANSACTIONS);
    page = await collectPage(targetTransactions);
  }

  const resume = buildResumePoint(page.items);

  return {
    items: page.items,
    next:
      page.hasMore && resume
        ? encodeOperationsCursor({ minHeight, maxBlockHeight, order, resume })
        : undefined,
  };
}
