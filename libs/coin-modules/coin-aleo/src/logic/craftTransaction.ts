import type { CraftedTransaction, MemoNotSupported } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { sdkClient } from "../network/sdk";
import { AleoTransactionIntentData } from "../types";
import { mapTransactionIntentToSdkIntent, serializeTransaction } from "./utils";

export async function craftTransaction({
  currency,
  txIntent,
  viewKey,
}: {
  currency: CryptoCurrency;
  txIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData>;
  viewKey?: string;
}): Promise<CraftedTransaction> {
  const intent = mapTransactionIntentToSdkIntent(txIntent);
  const response = await sdkClient.createRequestFromIntent({
    currency,
    intent,
    ...(viewKey !== undefined && { viewKey }),
  });

  const transaction = serializeTransaction(response);

  return { transaction };
}
