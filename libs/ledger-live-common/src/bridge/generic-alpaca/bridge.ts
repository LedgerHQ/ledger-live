import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export async function getBridgeApi(currency: CryptoCurrency, network: string): Promise<BridgeApi> {
  switch (network) {
    case "evm":
      return (await import("./loaders/evm.js")).bridge(currency);
    case "solana":
      return (await import("./loaders/solana.js")).bridge(currency);
    case "stellar":
      return (await import("./loaders/stellar.js")).bridge;
    case "tezos":
      return (await import("./loaders/tezos.js")).bridge;
    default:
      return {};
  }
}
