import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { EXPLORER_TRANSFER_TYPES, PROGRAM_ID } from "../constants";
import { parsePrivateOperation } from "../network/utils";
import type { AleoPrivateRecord } from "../types/api";
import type { AleoOperation } from "../types/bridge";

function onlyNativeCoinOperations(record: AleoPrivateRecord): boolean {
  const { program_name, function_name } = record;
  const allowedFunctions: string[] = [
    EXPLORER_TRANSFER_TYPES.PRIVATE,
    EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
    EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
  ];

  return program_name === PROGRAM_ID.CREDITS && allowedFunctions.includes(function_name);
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
  const privateOperations: AleoOperation[] = [];
  const nativePrivateTransactions = privateRecords.filter(onlyNativeCoinOperations);

  await promiseAllBatched(2, nativePrivateTransactions, async rawTx => {
    const parsedOperation = await parsePrivateOperation({
      currency,
      rawTx,
      viewKey,
      address,
      ledgerAccountId,
    });

    if (parsedOperation) privateOperations.push(parsedOperation);
  });

  return privateOperations;
}
