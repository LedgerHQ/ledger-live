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

function isRecordManagementRecord(record: AleoPrivateRecord): boolean {
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

async function listFeeOperations({
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

  const feeOnlyRecords = privateRecords.filter(
    record =>
      record.function_name === EXPLORER_TRANSFER_TYPES.FEE_PRIVATE &&
      !listedTransactionIds.has(record.transaction_id.trim()),
  );

  const results = await promiseAllBatched(2, feeOnlyRecords, async feeRecord => {
    signal?.throwIfAborted();
    const details = await apiClient.getTransactionById(config, feeRecord.transaction_id.trim());
    const consumedRecordTags = (details.fee?.transition.inputs ?? [])
      .filter(onlyTaggedRecordValue)
      .map(input => input.tag);
    const operations = isStakingTransaction(details)
      ? []
      : [toPrivateFeeBridgeOperation(ledgerAccountId, feeRecord, details, address)];

    return { operations, consumedRecordTags };
  });

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

  const [enrichedRecords, feeOnly] = await Promise.all([
    enrichPrivateRecords({
      config,
      viewKey,
      address,
      records: recordsToEnrich.filter(record => !isRecordManagementRecord(record)),
      ...(onProgress && { onProgress }),
      ...(signal && { signal }),
    }),
    listFeeOperations({
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
    ...feeOnly.consumedRecordTags,
  ]);

  const operations = enrichedRecords
    .filter((record): record is EnrichedPrivateRecord => {
      return record !== null && nativeRecordTags.has(record.rawRecord.tag);
    })
    .map(record => toPrivateBridgeOperation(ledgerAccountId, record, address));

  return { operations: [...operations, ...feeOnly.operations], consumedRecordTags };
}
