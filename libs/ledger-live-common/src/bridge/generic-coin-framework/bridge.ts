import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export async function getBridgeApi(currency: CryptoCurrency, network: string): Promise<BridgeApi> {
  switch (network) {
    case "evm":
      return (await import("./families/evm/bridge")).default(currency);
    case "solana":
      return (await import("./families/solana/bridge")).default(currency);
    case "stellar":
      return (await import("./families/stellar/bridge")).default;
    case "tezos":
      return (await import("./families/tezos/bridge")).default;
    default:
      return {};
  }
}
