import buildCoinConfig, { type CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type HederaConfig = {
  useHgraphForErc20: boolean;
};

export type HederaCoinConfig = CurrencyConfig & HederaConfig;

const coinConfig = buildCoinConfig<HederaCoinConfig>();

export default coinConfig;
