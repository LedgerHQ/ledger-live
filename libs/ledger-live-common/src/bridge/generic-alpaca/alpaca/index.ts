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
        return (await import("../loaders/xrp.js")).createApi(currency.id);
      case "stellar":
        return (await import("../loaders/stellar.js")).createApi(currency.id);
      case "canton":
        return (await import("../loaders/canton.js")).createApi(currency.id);
      case "tron":
        return (await import("../loaders/tron.js")).createApi(currency.id);
      case "evm":
        return (await import("../loaders/evm.js")).createApi(currency.id);
      case "tezos":
        return (await import("../loaders/tezos.js")).createApi(currency.id);
      case "solana":
        return (await import("../loaders/solana.js")).createApi(currency.id);
    }
  }
  return getNetworkAlpacaApi(network) satisfies Partial<AlpacaApi<any> & BridgeApi>;
}
