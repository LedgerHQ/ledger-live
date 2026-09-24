import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import { broadcastTx } from "../network/api";
import type { StacksCurrencyConfig } from "../config";

export async function broadcast(
  config: StacksCurrencyConfig,
  tx: string,
  _broadcastConfig?: BroadcastConfig,
): Promise<string> {
  const raw = Buffer.from(tx.replace(/^0x/, ""), "hex");
  return broadcastTx(config, raw);
}
