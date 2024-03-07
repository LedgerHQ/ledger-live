import { CryptoCurrency, EthereumLikeInfo } from "@ledgerhq/types-cryptoassets";

type EvmCoinConfig = {
  info: EthereumLikeInfo;
};

export type CoinConfig = (currency: CryptoCurrency) => EvmCoinConfig;

let coinConfig: CoinConfig | undefined;

export const setCoinConfig = (config: CoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (currency: CryptoCurrency): EvmCoinConfig => {
  if (!coinConfig) {
    throw new Error("EVM module config not set");
  }

  return coinConfig(currency);
};
