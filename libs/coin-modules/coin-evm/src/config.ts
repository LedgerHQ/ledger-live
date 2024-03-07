import { CryptoCurrency, EthereumLikeInfo } from "@ledgerhq/types-cryptoassets";

type EvmCoinConfig = {
  info: EthereumLikeInfo;
};

export type GetCoinConfig = (currency: CryptoCurrency) => EvmCoinConfig;
