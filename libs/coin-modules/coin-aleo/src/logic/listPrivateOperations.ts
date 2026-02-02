import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { TRANSFERS } from "../constants";
import { apiClient } from "../network/api";
import { parsePrivateOperation } from "../network/utils";
import type { AleoPrivateRecord } from "../types/api";
import type { AleoOperation } from "../types/bridge";

export async function listPrivateOperations({
  currency,
  jwtToken,
  uuid,
  apiKey,
  viewKey,
  address,
  ledgerAccountId,
  start,
}: {
  currency: CryptoCurrency;
  jwtToken: string;
  uuid: string;
  apiKey: string;
  viewKey: string;
  address: string;
  ledgerAccountId: string;
  start: number;
}): Promise<{
  privateOperations: AleoOperation[];
  privateRecords: AleoPrivateRecord[];
}> {
  const privateOperations: AleoOperation[] = [];
  const provableApiResults = await apiClient.getAccountOwnedRecords({
    jwtToken,
    uuid,
    apiKey,
    start,
  });
  const privateRecords: AleoPrivateRecord[] = provableApiResults;

  // currently we only support native aleo coin operations & ignore rest
  const nativePrivateTransactions = provableApiResults.filter(
    ({ program_name, function_name }) =>
      program_name === "credits.aleo" && function_name === TRANSFERS.PRIVATE,
  );

  for (const rawTx of nativePrivateTransactions) {
    const parsedOperation = await parsePrivateOperation({
      currency,
      rawTx,
      viewKey,
      address,
      ledgerAccountId,
    });

    privateOperations.push(parsedOperation);
  }

  return {
    privateOperations,
    privateRecords,
  };
}
