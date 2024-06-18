import { CoinConfig, CurrencyConfig } from "@ledgerhq/coin-framework/config";

export type XrpConfig = CurrencyConfig & {
  node: string;
};

let coinConfig: () => XrpConfig | undefined;

export const setCoinConfig = (config: CoinConfig<XrpConfig>): void => {
  coinConfig = config;
};

export const getCoinConfig = (): XrpConfig => {
  if (!coinConfig?.()) {
    throw new Error("Xrp module config not set");
  }

  return coinConfig()!;
};
