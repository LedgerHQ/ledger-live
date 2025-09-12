import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

/**
 * IN FUTURE:
 * getTokenById shouldn't be a thing to implement. findTokenById wraps this.
 * findTokenByTicker usecase should be investigated: it can never be trusted because it's not unique (out of context of a CryptoCurrency / network).
 */

export type CryptoAssetsStore = {
  findTokenByAddress(address: string): Promise<TokenCurrency | undefined>;
  getTokenById(id: string): Promise<TokenCurrency>;
  findTokenById(id: string): Promise<TokenCurrency | undefined>;
  findTokenByAddressInCurrency(
    address: string,
    currencyId: string,
  ): Promise<TokenCurrency | undefined>;
  findTokenByTicker(ticker: string): Promise<TokenCurrency | undefined>;
};

export type CryptoAssetsStoreGetter = () => CryptoAssetsStore;
