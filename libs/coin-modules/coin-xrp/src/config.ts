import { CoinConfig, CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type XrpConfig = {
  node: string;
};

export type XrpCoinConfig = CurrencyConfig & XrpConfig;

let coinConfig: () => XrpCoinConfig | undefined;

export const setCoinConfig = (config: CoinConfig<XrpConfig>): void => {
  coinConfig = config;
};

export const getCoinConfig = (): XrpCoinConfig => {
  if (!coinConfig?.()) {
    throw new Error("Xrp module config not set");
  }

  return coinConfig()!;
};
