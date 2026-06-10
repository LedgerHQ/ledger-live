import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { findCryptoCurrencyByNetwork } from "../utils";
import { getNetworkCoinModuleApi } from "./network/network-coin-service";

/**
 * Lazy-load Coin Module API modules so consumers (e.g. wallet-cli EVM-only) do not evaluate
 * unrelated coin stacks (Tron pulls tronweb/protobuf, which breaks under some Bun runtimes).
 *
 * Uses dynamic `import()` so each build only loads the module for the matched family on demand.
 */
export async function getCoinModuleApi(
  network: string,
  kind: string,
): Promise<CoinModuleApi<any> & BridgeApi> {
  if (kind === "local") {
    const currency = findCryptoCurrencyByNetwork(network);
    switch (currency?.family) {
      case "xrp":
        return (await import("./local/xrp")).createLocalXrpApi(currency.id);
      case "stellar":
        return (await import("./local/stellar")).createLocalStellarApi(currency.id);
      case "canton":
        return (await import("./local/canton")).createLocalCantonApi(currency.id);
      case "tron":
        return (await import("./local/tron")).createLocalTronApi(currency.id);
      case "evm":
        return (await import("./local/evm")).createLocalEvmApi(currency.id);
      case "tezos":
        return (await import("./local/tezos")).createLocalTezosApi(currency.id);
      case "solana":
        return (await import("./local/solana")).createLocalSolanaApi(currency.id);
    }
  }
  return getNetworkCoinModuleApi(network) satisfies Partial<CoinModuleApi<any> & BridgeApi>;
}
