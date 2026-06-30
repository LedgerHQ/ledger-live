import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { loadBridgeApiForFamily } from "../../coin-modules/registry";

export async function getBridgeApi(currency: CryptoCurrency, network: string): Promise<BridgeApi> {
  const bridge = await loadBridgeApiForFamily(network);
  if (!bridge) return {};
  return typeof bridge === "function" ? bridge(currency) : bridge;
}
