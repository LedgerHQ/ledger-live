import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type ConcordiumConfig = {
  nodeUrl: string;
  minReserve: number;
};

export type ConcordiumCoinConfig = CurrencyConfig & ConcordiumConfig;

const coinConfig = buildCoinConfig<ConcordiumCoinConfig>();

export default coinConfig;
