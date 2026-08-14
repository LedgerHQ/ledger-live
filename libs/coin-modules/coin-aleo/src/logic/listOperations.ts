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
// Ceiling for the widening retry — so a pathologically dense block degrades to one large fetch, not an unbounded walk.
const MAX_TARGET_TRANSACTIONS = 2000;

// Deterministic pick so an unstable representative doesn't shift the resume-point boundary between calls.
function isEarlierOutput(candidate: AleoPrivateRecord, current: AleoPrivateRecord): boolean {
  if (candidate.output_index !== current.output_index) {
    return candidate.output_index < current.output_index;
  }

  return candidate.commitment < current.commitment;
}

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
  // Read on every page so a dropped enrollment surfaces as AleoApiConfigurationResetError rather than a bare 4xx.
  // synced_up_to ships with LIVE-34092; until then 0 — `synced: true` alone says nothing about how far the scanner got.
  const scannerStatus = await fetchRecordScannerStatus(config, provableId);
  const scannerSyncedHeight =
    typeof scannerStatus.synced_up_to === "number" ? scannerStatus.synced_up_to : 0;

  const maxBlockHeight = Math.min(
    cursor?.maxBlockHeight ?? scannerSyncedHeight,
    latestBlock.height,
  );

  if (!cursor && maxBlockHeight < minHeight) {
    return { items: [], next: undefined };
  }

  const { from, to } = resolveHeightWindow(cursor, minHeight, maxBlockHeight);

  if (from > to) {
    return { items: [], next: undefined };
  }

  const limit = Math.max(options.limit ?? DEFAULT_LIMIT, 1);

  // Kicked off once and awaited by every attempt — a widening retry reuses this fetch rather than refetching.
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

    const heights = publicPage.transactions.map(tx => tx.block_number);
    const windowFrom =
      publicPage.complete || order === "asc" ? from : Math.max(from, Math.min(...heights));
    const windowTo =
      publicPage.complete || order === "desc" ? to : Math.min(to, Math.max(...heights));
    const isInWindow = (height: number): boolean => height >= windowFrom && height <= windowTo;

    const publicTransactions = publicPage.transactions.filter(tx => isInWindow(tx.block_number));
    const publicTxIds = new Set(publicTransactions.map(tx => tx.transaction_id.trim()));

    const ownedRecordTxIds = new Set<string>();
    // One record per tx: a self-transfer owns both the output and the change, but produces one operation.
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
      items: dropThroughResumePoint(ordered, cursor?.resume, order),
      hasMore: !publicPage.complete,
    };
  }

  let targetTransactions = limit;
  let page = await collectPage(targetTransactions);

  // Widen if the resume block had more transactions than the target — otherwise we'd spin on the same cursor.
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
