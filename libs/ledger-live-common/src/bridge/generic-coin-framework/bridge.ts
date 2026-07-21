import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { loadBridgeApiForFamily } from "../../coin-modules/registry";

export async function getBridgeApi(currency: CryptoCurrency, network: string): Promise<BridgeApi> {
  const bridge = await loadBridgeApiForFamily(network);
  if (!bridge) return {};
  return typeof bridge === "function" ? bridge(currency) : bridge;
}
