import type { AlpacaApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { findCryptoCurrencyByNetwork } from "../utils";
import { getNetworkAlpacaApi } from "./network/network-alpaca";

/**
 * Lazy-load coin Alpaca API modules so consumers (e.g. wallet-cli EVM-only) do not evaluate
 * unrelated coin stacks (Tron pulls tronweb/protobuf, which breaks under some Bun runtimes).
 *
 * Uses dynamic `import()` so each build only loads the module for the matched family on demand.
 */
export async function getAlpacaApi(
  network: string,
  kind: string,
): Promise<AlpacaApi<any> & BridgeApi> {
  if (kind === "local") {
    const currency = findCryptoCurrencyByNetwork(network);
    switch (currency?.family) {
      case "xrp":
        return (await import("./local/xrp.js")).createLocalXrpApi(currency.id);
      case "stellar":
        return (await import("./local/stellar.js")).createLocalStellarApi(currency.id);
      case "canton":
        return (await import("./local/canton.js")).createLocalCantonApi(currency.id);
      case "tron":
        return (await import("./local/tron.js")).createLocalTronApi(currency.id);
      case "evm":
        return (await import("./local/evm.js")).createLocalEvmApi(currency.id);
      case "tezos":
        return (await import("./local/tezos.js")).createLocalTezosApi(currency.id);
      case "solana":
        return (await import("./local/solana.js")).createLocalSolanaApi(currency.id);
    }
  }
  return getNetworkAlpacaApi(network) satisfies Partial<AlpacaApi<any> & BridgeApi>;
}
