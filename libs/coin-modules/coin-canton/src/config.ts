import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type CantonConfig = {
  nodeUrl: string;
  minReserve: number;
};

export type CantonCoinConfig = CurrencyConfig & CantonConfig;

const coinConfig = buildCoinConfig<CantonCoinConfig>();

export default coinConfig;
