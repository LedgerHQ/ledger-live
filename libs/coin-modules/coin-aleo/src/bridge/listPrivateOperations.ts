import type {
  AleoOperation,
  AleoPrivateRecord,
  EnrichedPrivateRecord,
  AleoTransitionValue,
  AleoCoinConfig,
} from "../types";
import { enrichPrivateRecords } from "../network/utils";
import { toPrivateBridgeOperation } from "./utils";

// Records forwarded to another program carry no tag; the callee's transition holds it.
function onlyTaggedRecordValue(
  value: AleoTransitionValue,
): value is Extract<AleoTransitionValue, { tag: string }> {
  return "tag" in value;
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
      enriched.details.fee.transition,
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
