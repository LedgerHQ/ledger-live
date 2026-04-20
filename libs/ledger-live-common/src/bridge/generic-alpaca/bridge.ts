import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export async function getBridgeApi(currency: CryptoCurrency, network: string): Promise<BridgeApi> {
  switch (network) {
    case "evm": {
      const { evmBridge } = await import("./families/evm/bridge.js");
      return evmBridge(currency);
    }
    case "solana": {
      const { solanaBridge } = await import("./families/solana/bridge.js");
      return solanaBridge(currency);
    }
    case "stellar": {
      const { stellarBridge } = await import("./families/stellar/bridge.js");
      return stellarBridge;
    }
    case "tezos": {
      const { tezosBridge } = await import("./families/tezos/bridge.js");
      return tezosBridge;
    }
    default:
      return {};
  }
}
