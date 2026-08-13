import type {
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  estimateTransactionByteLength,
  fetchFeeEstimateTransaction,
  serializePayload,
} from "@stacks/transactions";
import { getStacksBaseUrl } from "../../network/api";
import type { StacksTxData } from "../../types";
import { getNextSequence } from "../account/getNextSequence";
import { buildUnsignedTx, NETWORK } from "./buildUnsignedTx";

/** Dynamic, byte-length-based fee (not flat), same underlying mechanism as before the SDK bump --
 * only the SDK call shape changed (`fetchFeeEstimateTransaction`'s 3-tier result; index 1/medium
 * is used here as the new adapter's default, distinct from the legacy bridge's index-0 choice
 * which is preserved as-is for behavioral parity in `estimateMaxSpendable`/`prepareTransaction`). */
export async function estimateFees(
  intent: TransactionIntent<MemoNotSupported, StacksTxData>,
  _customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const nonce = intent.sequence ?? (await getNextSequence(intent.sender));
  const tx = await buildUnsignedTx(intent, 0n, nonce);

  const [, mediumFee] = await fetchFeeEstimateTransaction({
    payload: serializePayload(tx.payload),
    estimatedLength: estimateTransactionByteLength(tx),
    network: NETWORK,
    client: { baseUrl: getStacksBaseUrl() },
  });

  return { value: BigInt(Math.round(mediumFee.fee)) };
}
