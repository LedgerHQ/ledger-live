import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export type CryptoAssetsStore = {
  findTokenByAddress(address: string): TokenCurrency | undefined;
  getTokenById(id: string): TokenCurrency;
  findTokenById(id: string): TokenCurrency | undefined;
  findTokenByAddressInCurrency(address: string, currencyId: string): TokenCurrency | undefined;
  findTokenByTicker(ticker: string): TokenCurrency | undefined;
};

export type CryptoAssetsStoreGetter = () => CryptoAssetsStore;
