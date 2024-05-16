import { CurrencyConfig, CoinConfig } from "@ledgerhq/coin-framework/config";
import { UnsetCoinConfig } from "@ledgerhq/coin-framework/errors";

type PolkadotConfig = {
  node: {
    url: string;
    credential?: string;
  };
};

export type PolkadotCoinConfigInfo = CurrencyConfig & PolkadotConfig;

let coinConfig: CoinConfig<PolkadotCoinConfigInfo> | undefined;

export const setCoinConfig = (config: CoinConfig<PolkadotCoinConfigInfo>): void => {
  coinConfig = config;
};

export const getCoinConfig = (): PolkadotCoinConfigInfo => {
  if (!coinConfig) {
    throw new UnsetCoinConfig();
  }

  return coinConfig();
};
