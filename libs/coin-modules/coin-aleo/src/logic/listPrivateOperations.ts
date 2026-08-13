import { promiseAllBatched } from "@ledgerhq/live-promise";
import type {
  AleoOperation,
  AleoPrivateRecord,
  EnrichedPrivateRecord,
  AleoTransitionValue,
  AleoCoinConfig,
} from "../types";
import { enrichPrivateRecord } from "../network/utils";
import { toPrivateBridgeOperation } from "./utils";

function onlyRecordValue(
  value: AleoTransitionValue,
): value is Extract<AleoTransitionValue, { type: "record" }> {
  return value.type === "record";
}

// Build the set of record tags consumed as inputs in outgoing transactions.
// This is used to compensate for the record scanner returning already-spent records as unspent.
export function buildConsumedRecordTags(
  enrichedRecords: (EnrichedPrivateRecord | null)[],
  address: string,
): Set<string> {
  const tags = new Set<string>();

  for (const enriched of enrichedRecords) {
    if (enriched?.rawRecord.sender !== address) continue;

    const txTransitions = [
      ...(enriched.details.execution?.transitions ?? []),
      enriched.details.fee.transition,
    ];

    const inputRecords = txTransitions.flatMap(({ inputs }) => inputs.filter(onlyRecordValue));

    for (const input of inputRecords) {
      tags.add(input.tag);
    }
  }

  return tags;
}

/**
 * Decrypts every supplied record. A decrypt failure rejects, so callers never see a partial set.
 *
 * Spend reconciliation is deliberately not part of this — only the bridge needs it, and pairs this
 * with {@link buildConsumedRecordTags}. A history listing does not: a record being spent later does
 * not unmake the operation that created it.
 */
export async function enrichPrivateRecords({
  config,
  viewKey,
  address,
  records,
  onProgress,
  signal,
}: {
  config: AleoCoinConfig;
  viewKey: string;
  address: string;
  records: AleoPrivateRecord[];
  onProgress?: (completed: number, total: number) => void;
  signal?: AbortSignal;
}): Promise<(EnrichedPrivateRecord | null)[]> {
  let completed = 0;

  return promiseAllBatched(2, records, async rawRecord => {
    signal?.throwIfAborted();
    const result = await enrichPrivateRecord({ config, rawRecord, address, viewKey });
    onProgress?.(++completed, records.length);
    return result;
  });
}

export async function listPrivateOperations({
  config,
  viewKey,
  address,
  ledgerAccountId,
  privateRecords,
  onProgress,
  signal,
  tokenRecords,
}: {
  config: AleoCoinConfig;
  viewKey: string;
  address: string;
  ledgerAccountId: string;
  privateRecords: AleoPrivateRecord[];
  onProgress?: (completed: number, total: number) => void;
  signal?: AbortSignal;
  tokenRecords?: AleoPrivateRecord[];
}): Promise<{
  operations: AleoOperation[];
  consumedRecordTags: Set<string>;
}> {
  const recordsToEnrich = tokenRecords ? [...privateRecords, ...tokenRecords] : privateRecords;
  const nativeRecordTags = new Set(privateRecords.map(record => record.tag));

  const enrichedRecords = await enrichPrivateRecords({
    config,
    viewKey,
    address,
    records: recordsToEnrich,
    ...(onProgress && { onProgress }),
    ...(signal && { signal }),
  });

  const consumedRecordTags = buildConsumedRecordTags(enrichedRecords, address);

  const operations = enrichedRecords
    .filter((record): record is EnrichedPrivateRecord => {
      return record !== null && nativeRecordTags.has(record.rawRecord.tag);
    })
    .map(record => toPrivateBridgeOperation(ledgerAccountId, record, address));

  return { operations, consumedRecordTags };
}
