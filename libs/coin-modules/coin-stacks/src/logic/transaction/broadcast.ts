import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import { broadcastTx } from "../../network/api";

export async function broadcast(tx: string, _broadcastConfig?: BroadcastConfig): Promise<string> {
  const raw = Buffer.from(tx.replace(/^0x/, ""), "hex");
  return broadcastTx(raw);
}
