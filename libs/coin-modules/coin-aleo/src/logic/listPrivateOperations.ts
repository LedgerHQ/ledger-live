import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { PROGRAM_ID, TRANSFERS } from "../constants";
import { parsePrivateOperation } from "../network/utils";
import type { AleoPrivateRecord } from "../types/api";
import type { AleoOperation } from "../types/bridge";

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

  // currently we only support native aleo coin operations & ignore rest
  const nativePrivateTransactions = privateRecords.filter(({ program_name, function_name }) => {
    return program_name === PROGRAM_ID.CREDITS && function_name === TRANSFERS.PRIVATE;
  });

  await promiseAllBatched(2, nativePrivateTransactions, async rawTx => {
    const parsedOperation = await parsePrivateOperation({
      currency,
      rawTx,
      viewKey,
      address,
      ledgerAccountId,
    });

    privateOperations.push(parsedOperation);
  });

  return privateOperations;
}
