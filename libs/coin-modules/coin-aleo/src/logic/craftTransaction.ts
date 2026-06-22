import invariant from "invariant";
import type {
  CraftedTransaction,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { sdkClient } from "../network/sdk";
import type { AleoTransactionIntentData, FeeConfiguration } from "../types";
import { mapTransactionIntentToSdkIntent, toHex } from "./utils";

export async function craftTransaction({
  currency,
  txIntent,
  feeConfiguration,
  viewKey,
  tvks,
}: {
  currency: CryptoCurrency;
  txIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData>;
  feeConfiguration: FeeConfiguration | null;
  viewKey?: string;
  tvks?: string[];
}): Promise<CraftedTransaction> {
  const intent = mapTransactionIntentToSdkIntent(txIntent);

  if ("records" in intent && intent.records.length > 1) {
    invariant(tvks, "aleo: tvks are required for transactions with nested calls");
  }

  const response = await sdkClient.createRequestFromIntent({
    currency,
    intent,
    feeConfiguration,
    ...(viewKey !== undefined && { viewKey }),
    ...(tvks !== undefined && { tvks }),
  });

  const transaction = toHex(response);

  return { transaction };
}
