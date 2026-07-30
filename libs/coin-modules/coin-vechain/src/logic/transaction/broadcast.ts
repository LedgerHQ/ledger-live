import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import { submit } from "../../network";
import type { VechainSDKTransaction } from "../../types";

// Submit a signed tx (hex from combine) via Thor POST /transactions.
export async function broadcast(tx: string, _broadcastConfig?: BroadcastConfig): Promise<string> {
  const encoded = Uint8Array.from(Buffer.from(tx.replace(/^0x/, ""), "hex"));

  return submit({ encoded } as VechainSDKTransaction);
}
