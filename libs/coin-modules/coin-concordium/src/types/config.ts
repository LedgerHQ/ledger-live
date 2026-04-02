import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type ConcordiumNetwork = "mainnet" | "testnet";

export type ConcordiumConfig = {
  networkType: ConcordiumNetwork;
  proxyUrl: string;
  minReserve: number;
};

export type ConcordiumCoinConfig = CurrencyConfig & ConcordiumConfig;
