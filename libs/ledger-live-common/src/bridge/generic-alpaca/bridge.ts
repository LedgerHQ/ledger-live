import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import evmBridge from "./families/evm/bridge";
import stellarBridge from "./families/stellar/bridge";

export function getBridgeApi(currency: CryptoCurrency, network: string): BridgeApi {
  switch (network) {
    case "evm":
      return evmBridge(currency);
    case "stellar":
      return stellarBridge;
    default:
      return {};
  }
}
