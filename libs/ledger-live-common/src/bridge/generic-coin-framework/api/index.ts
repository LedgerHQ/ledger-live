import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { findCryptoCurrencyByNetwork } from "../utils";
import { resolveA4ChainConfig } from "../config";
import { loadLocalApiForFamily } from "../../../coin-modules/registry";
import { getNetworkCoinModuleApi } from "./network/network-coin-service";
import { createA4CoinModuleApi } from "./a4";

type Api = CoinModuleApi<any> & BridgeApi;

// Resolves the base (write/fallback) coin module: `local` via the registry, otherwise `remote`.
// Local adapters are resolved lazily so consumers don't evaluate unrelated coin stacks.
async function getDelegateApi(network: string, kind: string): Promise<Api> {
  if (kind === "local") {
    const currency = findCryptoCurrencyByNetwork(network);
    const createLocalApi =
      currency && (await loadLocalApiForFamily(currency.family));
    if (createLocalApi) return createLocalApi(currency.id);
  }
  return getNetworkCoinModuleApi(network) satisfies Partial<Api>;
}

export async function getCoinModuleApi(
  network: string,
  kind: string,
): Promise<Api> {
  const delegate = await getDelegateApi(network, kind);
  // A4 read/registration is layered per-chain via remote coin config (see ./config).
  // The delegate keeps serving the write path, staking, and any A4 fallback.
  const { read, register, endpoint } = resolveA4ChainConfig(network);
  if (read || register) {
    return createA4CoinModuleApi(network, delegate, { read, endpoint });
  }
  return delegate;
}
