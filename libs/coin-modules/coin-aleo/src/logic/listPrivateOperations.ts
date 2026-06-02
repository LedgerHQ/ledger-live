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

export async function listPrivateOperations({
  currency,
  viewKey,
  address,
  ledgerAccountId,
  privateRecords,
  // TODO: probably something we should refactor when cleaning up the code
  // this is used only to calculate consumed record tags
  // we assume that records spent before are already cleared from the scanner
  tokenRecords,
  onProgress,
  signal,
}: {
  currency: CryptoCurrency;
  viewKey: string;
  address: string;
  ledgerAccountId: string;
  privateRecords: AleoPrivateRecord[];
  tokenRecords?: AleoPrivateRecord[];
  onProgress?: (completed: number, total: number) => void;
  signal?: AbortSignal;
}): Promise<{
  operations: AleoOperation[];
  consumedRecordTags: Set<string>;
}> {
  const recordsToEnrich = tokenRecords ? [...privateRecords, ...tokenRecords] : privateRecords;
  const nativeRecordTags = new Set(privateRecords.map(record => record.tag));
  const consumedRecordTags = new Set<string>();

  let completed = 0;
  const enrichedRecords = await promiseAllBatched(2, recordsToEnrich, async rawRecord => {
    signal?.throwIfAborted();
    const result = await enrichPrivateRecord({ currency, rawRecord, address, viewKey });
    onProgress?.(++completed, recordsToEnrich.length);
    return result;
  });

  // Build the set of record tags consumed as inputs in outgoing transactions.
  // This is used to compensate for the record scanner returning already-spent records as unspent.
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

  const operations = enrichedRecords
    .filter((record): record is EnrichedPrivateRecord => {
      // we added token records to enrichedRecords just for calculating consumed record tags
      // they were not on this level before, so now we need to exclude them
      return record !== null && nativeRecordTags.has(record.rawRecord.tag);
    })
    .map(record => toPrivateBridgeOperation(ledgerAccountId, record, address));

  return { operations, consumedRecordTags };
}
