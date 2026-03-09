import buildConConfig, { type CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

export type XrpConfig = {
  node: string;
};

export type XrpCoinConfig = CurrencyConfig & XrpConfig;

const coinConfig = buildConConfig<XrpCoinConfig>();

export default coinConfig;
