import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type {
  AleoOperation,
  AleoPrivateRecord,
  EnrichedPrivateRecord,
  AleoTransitionValue,
} from "../types";
import { EXPLORER_TRANSFER_TYPES, PROGRAM_ID } from "../constants";
import { enrichPrivateRecord } from "../network/utils";
import { toPrivateBridgeOperation } from "./utils";

const NATIVE_PRIVATE_FUNCTIONS = new Set([
  EXPLORER_TRANSFER_TYPES.PRIVATE,
  EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
  EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
]);

function onlyNativeCoinOperations(record: AleoPrivateRecord): boolean {
  return (
    record.program_name === PROGRAM_ID.CREDITS && NATIVE_PRIVATE_FUNCTIONS.has(record.function_name)
  );
}

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
}: {
  currency: CryptoCurrency;
  viewKey: string;
  address: string;
  ledgerAccountId: string;
  privateRecords: AleoPrivateRecord[];
}): Promise<{
  operations: AleoOperation[];
  consumedRecordTags: Set<string>;
}> {
  const consumedRecordTags = new Set<string>();
  const nativePrivateRecords = privateRecords.filter(onlyNativeCoinOperations);
  const enrichedRecords = await promiseAllBatched(2, nativePrivateRecords, rawRecord =>
    enrichPrivateRecord({ configOrCurrencyId: currency.id, rawRecord, address, viewKey }),
  );

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
    .filter((record): record is EnrichedPrivateRecord => record !== null)
    .map(record => toPrivateBridgeOperation(ledgerAccountId, record, address));

  return { operations, consumedRecordTags };
}
