import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import { submitTransaction } from "../api/submitTransaction";
import type { CardanoCoinConfig } from "../config";

export async function broadcast(
  config: CardanoCoinConfig,
  {
    signature,
  }: {
    signature: string;
    // Accepted for CoinModuleApi parity; Cardano's submit endpoint doesn't use it.
    broadcastConfig?: BroadcastConfig;
  },
): Promise<string> {
  // submitTransaction is typed to return a hash, but guard against a malformed
  // (yet 2xx) API response so we surface a clear error instead of returning
  // undefined-as-string or throwing an opaque TypeError on destructuring.
  const result = await submitTransaction(config, { transaction: signature });
  if (!result?.hash) {
    throw new Error("Cardano broadcast: submit response is missing the transaction hash");
  }
  return result.hash;
}
