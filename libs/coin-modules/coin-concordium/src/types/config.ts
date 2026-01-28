import type { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export type ConcordiumNetwork = "Mainnet" | "Testnet";

export type ConcordiumConfig = {
  networkType: "mainnet" | "testnet";
  grpcUrl: string;
  grpcPort: number;
  proxyUrl: string;
  minReserve: number;
  currency?: CryptoCurrency;
};

export type ConcordiumCoinConfig = CurrencyConfig & ConcordiumConfig;
