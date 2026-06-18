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

export async function listPrivateOperations({
  currency,
  viewKey,
  address,
  ledgerAccountId,
  privateRecords,
  onProgress,
  signal,
  tokenRecords,
}: {
  currency: CryptoCurrency;
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

  let completed = 0;
  const enrichedRecords = await promiseAllBatched(2, recordsToEnrich, async rawRecord => {
    signal?.throwIfAborted();
    const result = await enrichPrivateRecord({ currency, rawRecord, address, viewKey });
    onProgress?.(++completed, recordsToEnrich.length);
    return result;
  });

  const consumedRecordTags = buildConsumedRecordTags(enrichedRecords, address);

  const operations = enrichedRecords
    .filter((record): record is EnrichedPrivateRecord => {
      return record !== null && nativeRecordTags.has(record.rawRecord.tag);
    })
    .map(record => toPrivateBridgeOperation(ledgerAccountId, record, address));

  return { operations, consumedRecordTags };
}
