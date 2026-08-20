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
import { getConfiguredStacksNetwork } from "../common-logic";
import { getStacksBaseUrl } from "../network/api";
import type { StacksTxData } from "../types";
import { getNextSequence } from "./getNextSequence";
import { buildUnsignedTx } from "./buildUnsignedTx";

/** Dynamic, byte-length-based fee (not flat), same underlying mechanism as before the SDK bump --
 * only the SDK call shape changed (`fetchFeeEstimateTransaction`'s 3-tier result). Index 0/low,
 * same tier the legacy bridge picks (`estimateMaxSpendable`/`prepareTransaction`) -- this migration
 * preserves the same fee tier as before, not a deliberate behavior change. */
export async function estimateFees(
  intent: TransactionIntent<MemoNotSupported, StacksTxData>,
  _customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const nonce = intent.sequence ?? (await getNextSequence(intent.sender));
  const tx = await buildUnsignedTx(intent, 0n, nonce);

  const [lowFee] = await fetchFeeEstimateTransaction({
    payload: serializePayload(tx.payload),
    estimatedLength: estimateTransactionByteLength(tx),
    network: getConfiguredStacksNetwork(),
    client: { baseUrl: getStacksBaseUrl() },
  });

  return { value: BigInt(Math.round(lowFee.fee)) };
}
