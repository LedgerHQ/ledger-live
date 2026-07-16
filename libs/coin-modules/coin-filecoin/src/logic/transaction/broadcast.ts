import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/index";
import { broadcastTx } from "../../network/api";
import type { BroadcastTransactionRequest } from "../../types";

// The input tx is a JSON-serialised BroadcastTransactionRequest produced by combine().
export async function broadcast(tx: string, _broadcastConfig?: BroadcastConfig): Promise<string> {
  const request: BroadcastTransactionRequest = JSON.parse(tx);
  const resp = await broadcastTx(request);

  if (!resp.hash) {
    throw new Error("Broadcast succeeded but returned an empty transaction hash");
  }

  return resp.hash;
}
