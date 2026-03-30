import type {
  CraftedTransaction,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { sdkClient } from "../network/sdk";
import type { AleoTransactionIntentData, FeeConfiguration } from "../types";
import { mapTransactionIntentToSdkIntent, toHex } from "./utils";

export async function craftTransaction({
  currency,
  txIntent,
  feeConfiguration,
  viewKey,
}: {
  currency: CryptoCurrency;
  txIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData>;
  feeConfiguration: FeeConfiguration | null;
  viewKey?: string;
}): Promise<CraftedTransaction> {
  const intent = mapTransactionIntentToSdkIntent(txIntent);
  const response = await sdkClient.createRequestFromIntent({
    currency,
    intent,
    feeConfiguration,
    ...(viewKey !== undefined && { viewKey }),
  });

  const transaction = toHex(response);

  return { transaction };
}
