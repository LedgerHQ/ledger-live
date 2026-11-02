import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import { withDefaults, withLogging } from "@ledgerhq/coin-module-framework/api/index";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { findCryptoCurrencyByNetwork } from "../utils";
import { loadLocalApiForFamily } from "../../../coin-modules/registry";
import { getNetworkCoinModuleApi } from "./network/network-coin-service";
import { withMetrics } from "./metrics";

// Local adapter resolved lazily via the registry so consumers don't evaluate unrelated coin stacks.
//
// Both branches go through the same wrappers, so the guarantees hold for every resolved module
// rather than per coin module: `withDefaults` backfills the capabilities a module does not implement
// (a module may then omit them instead of hand-writing a throwing stub), `withMetrics` reports each
// call to the host's observers, and `withLogging` reports it through the per-call Context logger.
// All preserve the BridgeApi half of the value and leave implemented methods untouched.
// `withMetrics` sits directly on `withDefaults`: it recognises the "not supported" stubs by their
// tag, which an outer wrapper would hide.
export async function getCoinModuleApi(
  network: string,
  kind: string,
): Promise<CoinModuleApi<any> & BridgeApi> {
  const currency = findCryptoCurrencyByNetwork(network);
  const labels = { network, family: currency?.family ?? "unknown" };
  if (kind === "local") {
    const createLocalApi = currency && (await loadLocalApiForFamily(currency.family));
    if (createLocalApi) {
      return withLogging(withMetrics(withDefaults(createLocalApi(currency.id)), labels));
    }
  }
  return withLogging(withMetrics(withDefaults(getNetworkCoinModuleApi(network)), labels));
}
