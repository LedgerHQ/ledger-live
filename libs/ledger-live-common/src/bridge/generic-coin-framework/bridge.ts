import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { loadBridgeApiForFamily } from "../../coin-modules/registry";

export async function getBridgeApi(currency: CryptoCurrency, network: string): Promise<BridgeApi> {
  const bridge = await loadBridgeApiForFamily(network);
  if (!bridge) return {};
  return typeof bridge === "function" ? bridge(currency) : bridge;
}

/**
 * The same resolution, made synchronous by loading the family's module once: for the bridge hooks
 * that are called synchronously (`postSync`, `getSerializedAddressParameters`).
 */
export async function getBridgeApiResolver(
  network: string,
): Promise<(currency: CryptoCurrency) => BridgeApi> {
  const bridge = await loadBridgeApiForFamily(network);
  return currency => {
    if (!bridge) return {};
    return typeof bridge === "function" ? bridge(currency) : bridge;
  };
}
