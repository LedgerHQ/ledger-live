import buildConConfig, { type CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type BoilerplateConfig = {
  nodeUrl: string;
  minReserve: number;
};

export type BoilerplateCoinConfig = CurrencyConfig & BoilerplateConfig;

const coinConfig = buildConConfig<BoilerplateCoinConfig>();

export default coinConfig;
