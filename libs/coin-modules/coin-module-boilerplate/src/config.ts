import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type BoilerplateConfig = {
  nodeUrl: string;
  minReserve: number;
};

export type BoilerplateCoinConfig = CurrencyConfig & BoilerplateConfig;

const coinConfig = buildCoinConfig<BoilerplateCoinConfig>();

export default coinConfig;
