import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import type { VechainContext } from "../../config";
import { submit } from "../../network";
import type { VechainSDKTransaction } from "../../types";

// Submit a signed tx (hex from combine) via Thor POST /transactions.
export async function broadcast(
  context: VechainContext,
  tx: string,
  _broadcastConfig?: BroadcastConfig,
): Promise<string> {
  const config = await context.config();
  const encoded = Uint8Array.from(Buffer.from(tx.replace(/^0x/, ""), "hex"));

  return submit(config, { encoded } as VechainSDKTransaction);
}
