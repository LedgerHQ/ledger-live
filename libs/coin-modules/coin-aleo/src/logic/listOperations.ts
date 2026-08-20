import invariant from "invariant";
import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/types";
import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import { EXPLORER_TRANSFER_TYPES } from "../constants";
import { apiClient } from "../network/api";
import {
  enrichPrivateRecords,
  fetchAllOwnedRecords,
  fetchAllTokens,
  fetchTransitionPage,
  getRecordScannerStatusOrThrow,
  resolveTransferArguments,
} from "../network/utils";
import type {
  AleoCoinConfig,
  AleoPrivateRecord,
  AleoPublicTransaction,
  AleoTokenType,
  AleoTransitionCursor,
  AleoExactTransitionCursor,
  OperationsCursor,
} from "../types";
import { lastBlock } from "./lastBlock";
import {
  classifyAleoTokenType,
  hasPublicAddress,
  isParsableTransferFunction,
  stripBatcherSuffix,
  toPrivateOperation,
  toPublicOperation,
} from "./utils";

function encodeCursor(maxBlockHeight: number, resumeFrom: AleoExactTransitionCursor): string {
  return `${maxBlockHeight}:${resumeFrom.blockNumber}:${resumeFrom.transitionId}`;
}

function isValidHeight(raw: string | undefined): boolean {
  return Boolean(raw) && Number.isInteger(Number(raw)) && Number(raw) >= 0;
}

function decodeCursor(raw: string): OperationsCursor {
  const [maxBlockHeight, blockNumber, transitionId] = raw.split(":");
  invariant(
    isValidHeight(maxBlockHeight) && isValidHeight(blockNumber) && transitionId,
    "aleo: malformed listOperations cursor",
  );

  return {
    maxBlockHeight: Number(maxBlockHeight),
    resumeFrom: { blockNumber: Number(blockNumber), transitionId },
  };
}

function firstPageCursor({
  order,
  minHeight,
  maxBlockHeight,
}: {
  order: "asc" | "desc";
  minHeight: number;
  maxBlockHeight: number;
}): AleoTransitionCursor | undefined {
  if (order === "desc") return { blockNumber: maxBlockHeight + 1 };

  return minHeight > 0 ? { blockNumber: minHeight - 1 } : undefined;
}

// One row per transition, so a multi-transition transaction arrives as several rows. An addressed
// row is the real transfer; ties break on `transition_id` so a replayed page picks the same row.
function dedupeByTransaction(transitions: AleoPublicTransaction[]): AleoPublicTransaction[] {
  const byTransactionId = new Map<string, AleoPublicTransaction>();

  for (const tx of transitions) {
    const current = byTransactionId.get(tx.transaction_id);

    if (current) {
      const candidateIsAddressed = hasPublicAddress(tx);
      const currentIsAddressed = hasPublicAddress(current);
      const isBetter =
        candidateIsAddressed === currentIsAddressed
          ? tx.transition_id < current.transition_id
          : candidateIsAddressed;

      if (!isBetter) continue;
    }

    byTransactionId.set(tx.transaction_id, tx);
  }

  return [...byTransactionId.values()];
}

function compareHash(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

// A self-transfer owns both the output record and the change record, but produces one operation.
function isEarlierOutput(candidate: AleoPrivateRecord, current: AleoPrivateRecord): boolean {
  if (candidate.output_index !== current.output_index) {
    return candidate.output_index < current.output_index;
  }

  return candidate.commitment < current.commitment;
}

/**
 * The private side of one page: an operation per owned record whose transaction has no public row,
 * plus `ownedRecordTxIds` for the transactions that do have one — those only need tagging.
 */
async function collectPrivateOperations({
  config,
  address,
  provableId,
  viewKey,
  publicTxIds,
  recordsFrom,
  recordsTo,
  tokenTypeByProgramName,
}: {
  config: AleoCoinConfig;
  address: string;
  provableId: string;
  viewKey: string;
  publicTxIds: Set<string>;
  recordsFrom: number;
  recordsTo: number;
  tokenTypeByProgramName: ReadonlyMap<string, AleoTokenType>;
}): Promise<{ ownedRecordTxIds: Set<string>; operations: Operation[] }> {
  const records = await fetchAllOwnedRecords({
    config,
    uuid: provableId,
    start: recordsFrom,
    end: recordsTo,
    // Both filters are server-side exact matches: `programs` would drop token records, and
    // `functions` would drop the batcher wrappers. Empty opts out of both; filtered below instead.
    programs: [],
    functions: [],
  });

  const ownedRecordTxIds = new Set<string>();
  const byTransactionId = new Map<string, AleoPrivateRecord>();

  for (const record of records) {
    if (!isParsableTransferFunction(record.function_name)) continue;

    // Redundant with the scanner's own bounds, but a page that re-emitted a covered block would
    // duplicate operations, so the window is not left to the filter alone.
    if (record.block_height < recordsFrom || record.block_height > recordsTo) continue;

    const transactionId = record.transaction_id.trim();
    ownedRecordTxIds.add(transactionId);
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
    ownedRecordTxIds,
    operations: enriched.flatMap(record =>
      record ? [toPrivateOperation(record, address, tokenTypeByProgramName)] : [],
    ),
  };
}

/**
 * A shield to a third party is the one counterparty no owned record reveals: the explorer blanks the
 * recipient and the account owns nothing on the private side, so the address has to be read back out
 * of the transition inputs. Only those rows are looked up, so an account that only ever shields to
 * itself pays for no extra requests.
 */
async function resolveThirdPartyShieldRecipients({
  config,
  viewKey,
  transactions,
  ownedRecordTxIds,
}: {
  config: AleoCoinConfig;
  viewKey: string;
  transactions: AleoPublicTransaction[];
  ownedRecordTxIds: Set<string>;
}): Promise<Map<string, string>> {
  const unresolved = transactions.filter(
    tx =>
      stripBatcherSuffix(tx.function_id) === EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE &&
      !tx.recipient_address &&
      !ownedRecordTxIds.has(tx.transaction_id),
  );

  const recipients = new Map<string, string>();

  await promiseAllBatched(4, unresolved, async tx => {
    const transactionId = tx.transaction_id;
    const { execution } = await apiClient.getTransactionById(config, transactionId);
    const transition =
      execution?.transitions.find(ts => ts.id === tx.transition_id) ?? execution?.transitions[0];
    if (!transition) return;

    const transferArguments = await resolveTransferArguments({
      config,
      transition,
      transactionId,
      viewKey,
    });

    if (transferArguments) {
      recipients.set(transactionId, transferArguments.recipient);
    }
  });

  return recipients;
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
  const { minHeight } = options;
  const order = options.order ?? "asc";
  const cursor = options.cursor ? decodeCursor(options.cursor) : null;

  const [latestBlock, scannerStatus, allTokens] = await Promise.all([
    lastBlock(config),
    // Read on every page so a dropped enrollment surfaces as AleoApiConfigurationResetError.
    getRecordScannerStatusOrThrow(config, provableId),
    // perf: re-read per page by design — a handful of tokens, one request in practice.
    fetchAllTokens({ config }),
  ]);

  const tokenTypeByProgramName = new Map<string, AleoTokenType>(
    allTokens.map(token => [token.program_name, classifyAleoTokenType(token)]),
  );

  // Above the scanner's watermark a shielded transfer would be listed as a bare public row and
  // change shape on a later sync, so the listing stops there. Pinned in the cursor so every page of
  // one listing sees the same snapshot.
  const scannerCeiling = scannerStatus.synced_up_to ?? 0;
  const maxBlockHeight = Math.min(cursor?.maxBlockHeight ?? scannerCeiling, latestBlock.height);

  // A resume cursor names the last row of a block already emitted whole, so this page starts past
  // it — otherwise the record fetch below re-emits the private-only records of covered blocks.
  const resumeFrom = cursor?.resumeFrom;
  const windowFrom =
    resumeFrom && order === "asc" ? Math.max(minHeight, resumeFrom.blockNumber + 1) : minHeight;
  const windowTo =
    resumeFrom && order === "desc"
      ? Math.min(maxBlockHeight, resumeFrom.blockNumber - 1)
      : maxBlockHeight;

  if (windowFrom > windowTo) return { items: [], next: undefined };

  const pageCursor = resumeFrom ?? firstPageCursor({ order, minHeight, maxBlockHeight });
  const { transitions, next } = await fetchTransitionPage({
    config,
    address,
    order,
    ...(options.limit && { limit: options.limit }),
    ...(pageCursor && { cursor: pageCursor }),
  });

  const inWindow = transitions.filter(
    tx => tx.block_number >= windowFrom && tx.block_number <= windowTo,
  );
  // Once the stream leaves the window there is nothing left to resume from.
  const isLastPage = next === null || inWindow.length < transitions.length;

  const lastFullBlockRow = isLastPage ? undefined : inWindow.at(-1);
  const recordsFrom =
    lastFullBlockRow && order === "desc" ? lastFullBlockRow.block_number : windowFrom;
  const recordsTo = lastFullBlockRow && order === "asc" ? lastFullBlockRow.block_number : windowTo;

  const publicTransactions = dedupeByTransaction(inWindow);
  const publicTxIds = new Set(publicTransactions.map(tx => tx.transaction_id));

  const { ownedRecordTxIds, operations: privateOperations } = await collectPrivateOperations({
    config,
    address,
    provableId,
    viewKey,
    publicTxIds,
    recordsFrom,
    recordsTo,
    tokenTypeByProgramName,
  });

  const shieldRecipients = await resolveThirdPartyShieldRecipients({
    config,
    viewKey,
    transactions: publicTransactions,
    ownedRecordTxIds,
  });

  const operations = publicTransactions.map(rawTx => {
    const resolvedRecipient = shieldRecipients.get(rawTx.transaction_id);

    return toPublicOperation({
      rawTx,
      address,
      hasOwnedRecord: ownedRecordTxIds.has(rawTx.transaction_id),
      tokenTypeByProgramName,
      ...(resolvedRecipient && { resolvedRecipient }),
    });
  });
  operations.push(...privateOperations);

  const direction = order === "asc" ? 1 : -1;
  operations.sort(
    (a, b) =>
      direction * (a.tx.block.height - b.tx.block.height || compareHash(a.tx.hash, b.tx.hash)),
  );

  return {
    items: operations,
    next: isLastPage || next === null ? undefined : encodeCursor(maxBlockHeight, next),
  };
}
