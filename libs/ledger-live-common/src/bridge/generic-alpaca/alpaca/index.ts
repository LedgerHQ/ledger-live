import type { AlpacaApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { findCryptoCurrencyByNetwork } from "../utils";
import { getNetworkAlpacaApi } from "./network/network-alpaca";

/**
 * Lazy-load coin Alpaca API modules so consumers (e.g. wallet-cli EVM-only) do not evaluate
 * unrelated coin stacks (Tron pulls tronweb/protobuf, which breaks under some Bun runtimes).
 *
 * Uses `require()` so the first `lib/` (CJS) build only loads the module for the matched family.
 * The `lib-es/` build reuses the same source; bundlers / Bun resolve these subpaths on demand.
 */
// TODO: we could also use dynamic import here but we need to update everything to async/await where getAlpacaApi is used
export function getAlpacaApi(network: string, kind: string): AlpacaApi<any> & BridgeApi {
  if (kind === "local") {
    const currency = findCryptoCurrencyByNetwork(network);
    switch (currency?.family) {
      case "xrp":
        return require("./local/xrp").createLocalXrpApi(currency.id);
      case "stellar":
        return require("./local/stellar").createLocalStellarApi(currency.id);
      case "canton":
        return require("./local/canton").createLocalCantonApi(currency.id);
      case "tron":
        return require("./local/tron").createLocalTronApi(currency.id);
      case "evm":
        return require("./local/evm").createLocalEvmApi(currency.id);
      case "tezos":
        return require("./local/tezos").createLocalTezosApi(currency.id);
      case "solana":
        return require("./local/solana").createLocalSolanaApi(currency.id);
    }
  }
  return getNetworkAlpacaApi(network) satisfies Partial<AlpacaApi<any> & BridgeApi>;
}
