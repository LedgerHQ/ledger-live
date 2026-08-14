import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/types";
import { PRIVATE_TRANSFER_FUNCTIONS } from "../constants";
import { fetchAllOwnedRecords, fetchRecordScannerStatus } from "../network/utils";
import type { AleoCoinConfig, AleoPrivateRecord } from "../types";
import { lastBlock } from "./lastBlock";
import { listPublicOperationsPage } from "./listPublicOperations";
import { enrichPrivateRecords } from "./listPrivateOperations";
import {
  assertCursorMatchesRequest,
  decodeOperationsCursor,
  encodeOperationsCursor,
  resolveBlockWindow,
  sortOperations,
} from "./listOperations.helpers";
import { toCoinFrameworkPrivateOperation, toMergedOperation } from "./utils";

const DEFAULT_LIMIT = 50;

// Deterministic pick so a replayed page returns the same rows.
function isEarlierOutput(candidate: AleoPrivateRecord, current: AleoPrivateRecord): boolean {
  if (candidate.output_index !== current.output_index) {
    return candidate.output_index < current.output_index;
  }

  return candidate.commitment < current.commitment;
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

  const window = resolveBlockWindow(cursor, minHeight, maxBlockHeight);

  if (!window) {
    return { items: [], next: undefined };
  }

  const { fromBlock, toBlock } = window;
  const minTransactions = Math.max(options.limit ?? DEFAULT_LIMIT, 1);

  const [publicPage, ownedRecords] = await Promise.all([
    listPublicOperationsPage({
      config,
      address,
      fromBlock,
      toBlock,
      minTransactions,
      order,
    }),
    fetchAllOwnedRecords({
      config,
      uuid: provableId,
      start: fromBlock,
      // empty opts out of the credits.aleo-only filter, so token records are included too
      programs: [],
      functions: [...PRIVATE_TRANSFER_FUNCTIONS],
    }),
  ]);

  // The scanner has no upper bound (`start` only), so records past the emitted blocks are filtered
  // here — they belong to a later page.
  const { nextBlock } = publicPage;
  const emittedFrom = nextBlock !== null && order === "desc" ? nextBlock + 1 : fromBlock;
  const emittedTo = nextBlock !== null && order === "asc" ? nextBlock - 1 : toBlock;

  const publicTransactions = publicPage.transactions;
  const publicTxIds = new Set(publicTransactions.map(tx => tx.transaction_id.trim()));

  const ownedRecordTxIds = new Set<string>();
  // One record per tx: a self-transfer owns both the output and the change, but produces one operation.
  const recordsToEnrich = new Map<string, AleoPrivateRecord>();

  for (const record of ownedRecords) {
    if (record.block_height < emittedFrom || record.block_height > emittedTo) continue;

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

  const operations = publicTransactions.map(rawTx =>
    toMergedOperation(rawTx, address, ownedRecordTxIds.has(rawTx.transaction_id.trim())),
  );

  for (const record of enrichedRecords) {
    if (record) operations.push(toCoinFrameworkPrivateOperation(record, address));
  }

  return {
    items: sortOperations(operations, order),
    next:
      nextBlock === null
        ? undefined
        : encodeOperationsCursor({ minHeight, maxBlockHeight, order, nextBlock }),
  };
}
