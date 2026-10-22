import type {
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { estimateTransactionByteLength, serializePayload } from "@stacks/transactions";
import { getConfiguredStacksNetwork } from "../common-logic";
import { getStacksBaseUrl } from "../network/api";
import { buildUnsignedTx } from "./buildUnsignedTx";
import { fetchLowTransactionFee } from "../network/fees";
import { getNextSequence } from "./getNextSequence";
import type { StacksTxData } from "../types";

export async function estimateFees(
  intent: TransactionIntent<MemoNotSupported, StacksTxData>,
  _customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const nonce = intent.sequence ?? (await getNextSequence(intent.sender));
  const tx = await buildUnsignedTx(intent, 0n, nonce, { forEstimation: true });

  const fee = await fetchLowTransactionFee({
    payload: serializePayload(tx.payload),
    estimatedLength: estimateTransactionByteLength(tx),
    network: getConfiguredStacksNetwork(),
    client: { baseUrl: getStacksBaseUrl() },
  });

  return { value: BigInt(fee) };
}
