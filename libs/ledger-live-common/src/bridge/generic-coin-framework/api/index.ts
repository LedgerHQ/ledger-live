import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import { withDefaults, withLogging } from "@ledgerhq/coin-module-framework/api/index";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { findCryptoCurrencyByNetwork } from "../utils";
import { loadLocalApiForFamily } from "../../../coin-modules/registry";
import { getNetworkCoinModuleApi } from "./network/network-coin-service";

// Local adapter resolved lazily via the registry so consumers don't evaluate unrelated coin stacks.
//
// Both branches go through the same two wrappers, so the guarantees hold for every resolved module
// rather than per coin module: `withDefaults` backfills the capabilities a module does not implement
// (a module may then omit them instead of hand-writing a throwing stub), and `withLogging` reports
// each call through the per-call Context logger. Both preserve the BridgeApi half of the value and
// leave implemented methods untouched.
export async function getCoinModuleApi(
  network: string,
  kind: string,
): Promise<CoinModuleApi<any> & BridgeApi> {
  if (kind === "local") {
    const currency = findCryptoCurrencyByNetwork(network);
    const createLocalApi = currency && (await loadLocalApiForFamily(currency.family));
    if (createLocalApi) return withLogging(withDefaults(createLocalApi(currency.id)));
  }
  return withLogging(withDefaults(getNetworkCoinModuleApi(network)));
}
