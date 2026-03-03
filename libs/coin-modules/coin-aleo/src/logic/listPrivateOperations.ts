import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type { AleoOperation, AleoPrivateRecord, EnrichedPrivateRecord } from "../types";
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
}): Promise<AleoOperation[]> {
  const nativePrivateRecords = privateRecords.filter(onlyNativeCoinOperations);

  const enrichedRecords = await promiseAllBatched(2, nativePrivateRecords, rawRecord =>
    enrichPrivateRecord({ currency, rawRecord, address, viewKey }),
  );

  return enrichedRecords
    .filter((record): record is EnrichedPrivateRecord => record !== null)
    .map(record => toPrivateBridgeOperation(ledgerAccountId, record, address));
}
