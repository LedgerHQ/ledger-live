import { promiseAllBatched } from "@ledgerhq/coin-module-framework/promises";
import type {
  AleoOperation,
  AleoPrivateRecord,
  AleoPublicTransactionDetailsResponse,
  EnrichedPrivateRecord,
  AleoTransitionValue,
  AleoCoinConfig,
} from "../types";
import { EXPLORER_TRANSFER_TYPES, PROGRAM_ID } from "../constants";
import { getStakingOperationType, isParsableTransferFunction } from "../logic/utils";
import { apiClient } from "../network/api";
import { enrichPrivateRecords } from "../network/utils";
import { toPrivateBridgeOperation, toPrivateFeeBridgeOperation } from "./utils";

// Records forwarded to another program carry no tag; the callee's transition holds it.
function onlyTaggedRecordValue(
  value: AleoTransitionValue,
): value is Extract<AleoTransitionValue, { tag: string }> {
  return "tag" in value;
}

function isJoinOrSplit(record: AleoPrivateRecord): boolean {
  return (
    record.function_name === EXPLORER_TRANSFER_TYPES.JOIN ||
    record.function_name === EXPLORER_TRANSFER_TYPES.SPLIT
  );
}

// Compensates for the record scanner returning already-spent records as unspent.
export function buildConsumedRecordTags(
  enrichedRecords: (EnrichedPrivateRecord | null)[],
  address: string,
): Set<string> {
  const tags = new Set<string>();

  for (const enriched of enrichedRecords) {
    if (enriched?.rawRecord.sender !== address) continue;

    const txTransitions = [
      ...(enriched.details.execution?.transitions ?? []),
      ...(enriched.details.fee ? [enriched.details.fee.transition] : []),
    ];

    const inputRecords = txTransitions.flatMap(({ inputs }) =>
      inputs.filter(onlyTaggedRecordValue),
    );

    for (const input of inputRecords) {
      tags.add(input.tag);
    }
  }

  return tags;
}

function isStakingTransaction({ execution }: AleoPublicTransactionDetailsResponse): boolean {
  return (execution?.transitions ?? []).some(
    transition =>
      transition.program === PROGRAM_ID.CREDITS &&
      getStakingOperationType(transition.function) !== undefined,
  );
}

// A rejected execution leaves its inputs unspent; only the fee is charged.
function getConsumedRecordTags({
  execution,
  fee,
  status,
}: AleoPublicTransactionDetailsResponse): string[] {
  const transitions = [
    ...(status === "Accepted" ? (execution?.transitions ?? []) : []),
    ...(fee ? [fee.transition] : []),
  ];

  return transitions.flatMap(({ inputs }) =>
    inputs.filter(onlyTaggedRecordValue).map(input => input.tag),
  );
}

async function listNonTransferTransactions({
  config,
  address,
  ledgerAccountId,
  privateRecords,
  knownTransactionIds,
  signal,
}: {
  config: AleoCoinConfig;
  address: string;
  ledgerAccountId: string;
  privateRecords: AleoPrivateRecord[];
  knownTransactionIds: ReadonlySet<string>;
  signal?: AbortSignal;
}): Promise<{
  operations: AleoOperation[];
  consumedRecordTags: string[];
}> {
  const listedTransactionIds = new Set([
    ...knownTransactionIds,
    ...privateRecords
      .filter(record => isParsableTransferFunction(record.function_name))
      .map(record => record.transaction_id.trim()),
  ]);

  const feeRecordByTransactionId = new Map<string, AleoPrivateRecord | undefined>();
  for (const record of privateRecords) {
    const transactionId = record.transaction_id.trim();
    if (listedTransactionIds.has(transactionId) && !isJoinOrSplit(record)) continue;

    if (record.function_name === EXPLORER_TRANSFER_TYPES.FEE_PRIVATE) {
      feeRecordByTransactionId.set(transactionId, record);
    } else if (isJoinOrSplit(record) && !feeRecordByTransactionId.has(transactionId)) {
      feeRecordByTransactionId.set(transactionId, undefined);
    }
  }

  const results = await promiseAllBatched(
    2,
    [...feeRecordByTransactionId],
    async ([transactionId, feeRecord]) => {
      signal?.throwIfAborted();
      const details = await apiClient.getTransactionById(config, transactionId);
      const operations =
        feeRecord && !isStakingTransaction(details)
          ? [toPrivateFeeBridgeOperation(ledgerAccountId, feeRecord, details, address)]
          : [];

      return { operations, consumedRecordTags: getConsumedRecordTags(details) };
    },
  );

  return {
    operations: results.flatMap(result => result.operations),
    consumedRecordTags: results.flatMap(result => result.consumedRecordTags),
  };
}

export async function listPrivateOperations({
  config,
  viewKey,
  address,
  ledgerAccountId,
  privateRecords,
  knownTransactionIds,
  onProgress,
  signal,
  tokenRecords,
}: {
  config: AleoCoinConfig;
  viewKey: string;
  address: string;
  ledgerAccountId: string;
  privateRecords: AleoPrivateRecord[];
  knownTransactionIds: ReadonlySet<string>;
  onProgress?: (completed: number, total: number) => void;
  signal?: AbortSignal;
  tokenRecords?: AleoPrivateRecord[];
}): Promise<{
  operations: AleoOperation[];
  consumedRecordTags: Set<string>;
}> {
  const recordsToEnrich = tokenRecords ? [...privateRecords, ...tokenRecords] : privateRecords;
  const nativeRecordTags = new Set(privateRecords.map(record => record.tag));

  const [enrichedRecords, nonTransfer] = await Promise.all([
    enrichPrivateRecords({
      config,
      viewKey,
      address,
      records: recordsToEnrich.filter(record => !isJoinOrSplit(record)),
      ...(onProgress && { onProgress }),
      ...(signal && { signal }),
    }),
    listNonTransferTransactions({
      config,
      address,
      ledgerAccountId,
      privateRecords,
      knownTransactionIds,
      ...(signal && { signal }),
    }),
  ]);

  const consumedRecordTags = new Set([
    ...buildConsumedRecordTags(enrichedRecords, address),
    ...nonTransfer.consumedRecordTags,
  ]);

  const operations = enrichedRecords
    .filter((record): record is EnrichedPrivateRecord => {
      return record !== null && nativeRecordTags.has(record.rawRecord.tag);
    })
    .map(record => toPrivateBridgeOperation(ledgerAccountId, record, address));

  return { operations: [...operations, ...nonTransfer.operations], consumedRecordTags };
}
