import invariant from "invariant";
import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/types";
import { PRIVATE_TRANSFER_FUNCTIONS } from "../constants";
import {
  fetchAllOwnedRecords,
  fetchRecordScannerStatus,
  fetchTransitionPage,
} from "../network/utils";
import type {
  AleoCoinConfig,
  AleoPrivateRecord,
  AleoPublicTransaction,
  AleoTransitionCursor,
  AleoTransitionResume,
} from "../types";
import { lastBlock } from "./lastBlock";
import { enrichPrivateRecords } from "./listPrivateOperations";
import { toCoinFrameworkPrivateOperation, toMergedOperation } from "./utils";

/**
 * `<maxBlockHeight>:<blockNumber>:<transitionId>` — the pinned ceiling, then the row to resume after.
 * The resume half is dropped on a cursor that only pins the range, which starts at the window edge.
 */
type OperationsCursor = {
  maxBlockHeight: number;
  resumeFrom?: AleoTransitionResume;
};

function encodeCursor(maxBlockHeight: number, resumeFrom: AleoTransitionResume): string {
  return `${maxBlockHeight}:${resumeFrom.blockNumber}:${resumeFrom.transitionId}`;
}

function decodeCursor(raw: string): OperationsCursor {
  const [maxBlockHeight, blockNumber, transitionId] = raw.split(":");
  invariant(Number.isInteger(Number(maxBlockHeight)), "aleo: malformed listOperations cursor");

  if (blockNumber === undefined) return { maxBlockHeight: Number(maxBlockHeight) };

  invariant(
    Number.isInteger(Number(blockNumber)) && transitionId,
    "aleo: malformed listOperations cursor",
  );

  return {
    maxBlockHeight: Number(maxBlockHeight),
    resumeFrom: { blockNumber: Number(blockNumber), transitionId },
  };
}

/** Where the first page of a listing starts: a whole-block bound on the edge of the window. */
function openingCursor(
  order: "asc" | "desc",
  minHeight: number,
  maxBlockHeight: number,
): AleoTransitionCursor | undefined {
  if (order === "desc") return { blockNumber: maxBlockHeight + 1 };

  return minHeight > 0 ? { blockNumber: minHeight - 1 } : undefined;
}

function hasAddress(tx: AleoPublicTransaction): boolean {
  return Boolean(tx.sender_address || tx.recipient_address);
}

// The explorer emits one row per transition, so a transaction spanning several arrives as several
// rows. Prefer the row carrying an address (the real transfer) over a batching contract's inner
// call, and break remaining ties on `transition_id` so a replayed page picks the same row.
function pickTransactionRepresentatives(
  transitions: AleoPublicTransaction[],
): AleoPublicTransaction[] {
  const byTransactionId = new Map<string, AleoPublicTransaction>();

  for (const tx of transitions) {
    const current = byTransactionId.get(tx.transaction_id);
    const isBetter =
      !current ||
      (hasAddress(tx) !== hasAddress(current)
        ? hasAddress(tx)
        : tx.transition_id < current.transition_id);

    if (isBetter) byTransactionId.set(tx.transaction_id, tx);
  }

  return [...byTransactionId.values()];
}

// A self-transfer owns both the output record and the change record, but produces one operation.
function isEarlierOutput(candidate: AleoPrivateRecord, current: AleoPrivateRecord): boolean {
  if (candidate.output_index !== current.output_index) {
    return candidate.output_index < current.output_index;
  }

  return candidate.commitment < current.commitment;
}

/**
 * The private half of one page: an operation for every owned record whose transaction has no public
 * row, plus the transactions that do have one — those only need tagging, the row already carries them.
 */
async function collectPrivateHalf({
  config,
  address,
  provableId,
  viewKey,
  publicTxIds,
  fromBlock,
  toBlock,
}: {
  config: AleoCoinConfig;
  address: string;
  provableId: string;
  viewKey: string;
  publicTxIds: Set<string>;
  fromBlock: number;
  toBlock: number;
}): Promise<{ taggedTxIds: Set<string>; operations: Operation[] }> {
  const records = await fetchAllOwnedRecords({
    config,
    uuid: provableId,
    start: fromBlock,
    // empty opts out of the credits.aleo-only filter, so token records are included too
    programs: [],
    functions: [...PRIVATE_TRANSFER_FUNCTIONS],
  });

  const taggedTxIds = new Set<string>();
  const byTransactionId = new Map<string, AleoPrivateRecord>();

  for (const record of records) {
    // The scanner takes a `start` but no upper bound, so the tail is dropped here.
    if (record.block_height < fromBlock || record.block_height > toBlock) continue;

    const transactionId = record.transaction_id.trim();
    taggedTxIds.add(transactionId);
    if (publicTxIds.has(transactionId)) continue;

    const current = byTransactionId.get(transactionId);
    if (!current || isEarlierOutput(record, current)) {
      byTransactionId.set(transactionId, record);
    }
  }

  const enriched = await enrichPrivateRecords({
    config,
    viewKey,
    address,
    records: [...byTransactionId.values()],
  });

  return {
    taggedTxIds,
    operations: enriched.flatMap(record =>
      record ? [toCoinFrameworkPrivateOperation(record, address)] : [],
    ),
  };
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
  provableId?: string;
  viewKey?: string;
}): Promise<Page<Operation>> {
  const { minHeight } = options;
  const order = options.order ?? "asc";
  const cursor = options.cursor ? decodeCursor(options.cursor) : null;

  const [latestBlock, scannerStatus] = await Promise.all([
    lastBlock(config),
    // Read on every page so a dropped enrollment surfaces as AleoApiConfigurationResetError rather
    // than a bare 4xx.
    provableId ? fetchRecordScannerStatus(config, provableId) : null,
  ]);

  // A public row may only be emitted for a block the scanner has already covered: below that height
  // a shielded transfer would be listed as a bare public row and change shape on a later sync.
  // synced_up_to ships with LIVE-34092; until then it is 0 and nothing is emitted, because
  // `synced: true` alone says nothing about how far the scanner actually got.
  const scannerCeiling = scannerStatus ? (scannerStatus.synced_up_to ?? 0) : latestBlock.height;
  // Pinned in the cursor so every page of one listing sees the same snapshot.
  const maxBlockHeight = Math.min(cursor?.maxBlockHeight ?? scannerCeiling, latestBlock.height);

  // A resume cursor names the last row of a block this listing has already emitted whole, so the
  // blocks left to this page start past it. Without that step the record fetch below would reach back
  // over blocks an earlier page already covered and emit their private-only records again.
  const resumedAt = cursor?.resumeFrom?.blockNumber;
  const windowFrom =
    resumedAt !== undefined && order === "asc" ? Math.max(minHeight, resumedAt + 1) : minHeight;
  const windowTo =
    resumedAt !== undefined && order === "desc"
      ? Math.min(maxBlockHeight, resumedAt - 1)
      : maxBlockHeight;

  if (windowFrom > windowTo) return { items: [], next: undefined };

  const pageCursor = cursor?.resumeFrom ?? openingCursor(order, minHeight, maxBlockHeight);
  const { transitions, next } = await fetchTransitionPage({
    config,
    address,
    order,
    // A limit of 0 would page forever without emitting anything; fall back to the explorer's own.
    ...(options.limit && { limit: options.limit }),
    ...(pageCursor && { cursor: pageCursor }),
  });

  const inWindow = transitions.filter(
    tx => tx.block_number >= windowFrom && tx.block_number <= windowTo,
  );
  // Once the stream leaves the window there is nothing left to resume from.
  const isLastPage = next === null || inWindow.length < transitions.length;

  // `fetchTransitionPage` cuts on a block boundary, so the blocks this page emits are whole and every
  // record they hold belongs to this page. The final page closes the window on the far side.
  const lastEmittedBlock = isLastPage ? null : (inWindow.at(-1)?.block_number ?? null);
  const fromBlock = lastEmittedBlock !== null && order === "desc" ? lastEmittedBlock : windowFrom;
  const toBlock = lastEmittedBlock !== null && order === "asc" ? lastEmittedBlock : windowTo;

  const publicTransactions = pickTransactionRepresentatives(inWindow);
  const publicTxIds = new Set(publicTransactions.map(tx => tx.transaction_id));

  // Reading the private half needs both halves of the enrollment; without them this is a public list.
  const { taggedTxIds, operations: privateOperations } =
    provableId && viewKey
      ? await collectPrivateHalf({
          config,
          address,
          provableId,
          viewKey,
          publicTxIds,
          fromBlock,
          toBlock,
        })
      : { taggedTxIds: new Set<string>(), operations: [] };

  const operations = publicTransactions.map(rawTx =>
    toMergedOperation(rawTx, address, taggedTxIds.has(rawTx.transaction_id)),
  );
  operations.push(...privateOperations);

  const direction = order === "asc" ? 1 : -1;
  operations.sort(
    (a, b) =>
      direction * (a.tx.block.height - b.tx.block.height || a.tx.hash.localeCompare(b.tx.hash)),
  );

  return {
    items: operations,
    next: isLastPage || next === null ? undefined : encodeCursor(maxBlockHeight, next),
  };
}
