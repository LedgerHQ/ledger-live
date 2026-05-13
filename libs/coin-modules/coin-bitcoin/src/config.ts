import { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";

// Side-effect: register the zcash chain adapter
import "./chain-adapters/zcash";

export type BitcoinConfigInfo = CurrencyConfig;

type BitcoinCoinConfig = {
  info: BitcoinConfigInfo;
};

export type CoinConfig = (currencyId: string) => BitcoinCoinConfig;

let coinConfig: CoinConfig | undefined;

export const setCoinConfig = (config: CoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (currencyId: string): BitcoinCoinConfig => {
  if (!coinConfig) {
    throw new Error("Bitcoin module config not set");
  }

  return coinConfig(currencyId);
};
