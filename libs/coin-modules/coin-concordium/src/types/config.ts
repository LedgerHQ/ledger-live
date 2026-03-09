import type { CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type ConcordiumNetwork = "mainnet" | "testnet";

export type ConcordiumConfig = {
  networkType: ConcordiumNetwork;
  grpcUrl: string;
  grpcPort: number;
  proxyUrl: string;
  minReserve: number;
};

export type ConcordiumCoinConfig = CurrencyConfig & ConcordiumConfig;
