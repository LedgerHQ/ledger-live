import invariant from "invariant";
import type {
  CraftedTransaction,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
import { sdkClient } from "../network/sdk";
import type { AleoCoinConfig, AleoTransactionIntentData, FeeConfiguration } from "../types";
import { mapTransactionIntentToSdkIntent, toHex } from "./utils";

export async function craftTransaction({
  config,
  txIntent,
  feeConfiguration,
  viewKey,
}: {
  config: AleoCoinConfig;
  txIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData>;
  feeConfiguration: FeeConfiguration | null;
  viewKey?: string;
}): Promise<CraftedTransaction> {
  const tvks = "data" in txIntent && "records" in txIntent.data ? txIntent.data.tvks : undefined;
  const intent = mapTransactionIntentToSdkIntent(txIntent);

  if ("records" in intent && intent.records.length > 1) {
    invariant(
      tvks && tvks.length > 0,
      "aleo: tvks are required for transactions with nested calls",
    );
  }

  const response = await sdkClient.createRequestFromIntent({
    config,
    intent,
    feeConfiguration,
    ...(viewKey !== undefined && { viewKey }),
    ...(tvks && tvks.length > 0 && { tvks }),
  });

  const transaction = toHex(response);

  return { transaction };
}
