import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export function getConcordiumNetwork(currency: CryptoCurrency): "Mainnet" | "Testnet" {
  return currency.isTestnetFor ? "Testnet" : "Mainnet";
}
