import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { findCryptoCurrencyByNetwork } from "../utils";
import { loadLocalApiForFamily } from "../../../coin-modules/registry";
import { getNetworkCoinModuleApi } from "./network/network-coin-service";

// Local adapter resolved lazily via the registry so consumers don't evaluate unrelated coin stacks.
export async function getCoinModuleApi(
  network: string,
  kind: string,
): Promise<CoinModuleApi<any> & BridgeApi> {
  if (kind === "local") {
    const currency = findCryptoCurrencyByNetwork(network);
    const createLocalApi = currency && (await loadLocalApiForFamily(currency.family));
    if (createLocalApi) return createLocalApi(currency.id);
  }
  return getNetworkCoinModuleApi(network) satisfies Partial<CoinModuleApi<any> & BridgeApi>;
}
