import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type {
  AleoOperation,
  AleoPrivateRecord,
  EnrichedPrivateRecord,
  AleoTransitionValue,
} from "../types";
import { enrichPrivateRecord } from "../network/utils";
import { toPrivateBridgeOperation } from "./utils";

function onlyRecordValue(
  value: AleoTransitionValue,
): value is Extract<AleoTransitionValue, { type: "record" }> {
  return value.type === "record";
}

function collectConsumedRecordTagsFromEnriched(
  enrichedRecords: (EnrichedPrivateRecord | null)[],
  address: string,
): Set<string> {
  const consumedRecordTags = new Set<string>();

  for (const enriched of enrichedRecords) {
    if (enriched?.rawRecord.sender !== address) continue;

    const txTransitions = [
      ...(enriched.details.execution?.transitions ?? []),
      enriched.details.fee.transition,
    ];

    const inputRecords = txTransitions.flatMap(({ inputs }) => inputs.filter(onlyRecordValue));

    for (const input of inputRecords) {
      consumedRecordTags.add(input.tag);
    }
  }

  return consumedRecordTags;
}

async function enrichPrivateRecords({
  currency,
  viewKey,
  address,
  privateRecords,
  onProgress,
  signal,
}: {
  currency: CryptoCurrency;
  viewKey: string;
  address: string;
  privateRecords: AleoPrivateRecord[];
  onProgress?: (completed: number, total: number) => void;
  signal?: AbortSignal;
}): Promise<(EnrichedPrivateRecord | null)[]> {
  let completed = 0;
  return promiseAllBatched(2, privateRecords, async rawRecord => {
    signal?.throwIfAborted();
    const result = await enrichPrivateRecord({ currency, rawRecord, address, viewKey });
    onProgress?.(++completed, privateRecords.length);
    return result;
  });
}

/**
 * Returns record tags consumed as transaction inputs in outgoing private transfers.
 * Used to filter scanner "unspent" records that are already spent in pending txs.
 */
export async function collectConsumedPrivateRecordTags({
  currency,
  viewKey,
  address,
  privateRecords,
  onProgress,
  signal,
}: {
  currency: CryptoCurrency;
  viewKey: string;
  address: string;
  privateRecords: AleoPrivateRecord[];
  onProgress?: (completed: number, total: number) => void;
  signal?: AbortSignal;
}): Promise<Set<string>> {
  const enrichedRecords = await enrichPrivateRecords({
    currency,
    viewKey,
    address,
    privateRecords,
    ...(onProgress && { onProgress }),
    ...(signal && { signal }),
  });
  return collectConsumedRecordTagsFromEnriched(enrichedRecords, address);
}

export async function listPrivateOperations({
  currency,
  viewKey,
  address,
  ledgerAccountId,
  privateRecords,
  onProgress,
  signal,
}: {
  currency: CryptoCurrency;
  viewKey: string;
  address: string;
  ledgerAccountId: string;
  privateRecords: AleoPrivateRecord[];
  onProgress?: (completed: number, total: number) => void;
  signal?: AbortSignal;
}): Promise<{
  operations: AleoOperation[];
  consumedRecordTags: Set<string>;
}> {
  const enrichedRecords = await enrichPrivateRecords({
    currency,
    viewKey,
    address,
    privateRecords,
    ...(onProgress && { onProgress }),
    ...(signal && { signal }),
  });

  const consumedRecordTags = collectConsumedRecordTagsFromEnriched(enrichedRecords, address);

  const operations = enrichedRecords
    .filter((record): record is EnrichedPrivateRecord => record !== null)
    .map(record => toPrivateBridgeOperation(ledgerAccountId, record, address));

  return { operations, consumedRecordTags };
}
