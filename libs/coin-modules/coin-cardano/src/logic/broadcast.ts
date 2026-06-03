import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { submitTransaction } from "../api/submitTransaction";

export async function broadcast(
  currency: CryptoCurrency,
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
  const result = await submitTransaction({ transaction: signature, currency });
  if (!result?.hash) {
    throw new Error("Cardano broadcast: submit response is missing the transaction hash");
  }
  return result.hash;
}
