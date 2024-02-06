// Expose only strict necessary coin-module logic to LLD and LLM
export {
  getSecp256k1Instance,
  setSecp256k1Instance,
} from "@ledgerhq/coin-bitcoin/wallet-btc/crypto/secp256k1";

export { getUTXOStatus } from "@ledgerhq/coin-bitcoin/logic";

import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
export type { AccountDescriptor } from "@ledgerhq/coin-bitcoin/descriptor";

import { scanDescriptors as moduleScanDescriptors } from "@ledgerhq/coin-bitcoin/descriptor";
import { signerContext } from "./setup";

export function scanDescriptors(deviceId: string, currency: CryptoCurrency, limit = 10) {
  return moduleScanDescriptors(deviceId, currency, signerContext, limit);
}
