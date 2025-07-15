import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export type ERC20Token = {
  parentCurrencyId: string;
  token: string;
  ticker: string;
  magnitude: number;
  name: string;
  ledgerSignature: string;
  contractAddress: string;
  disableCountervalue: false;
  delisted: boolean;
};

export type SPLToken = {
  id: string;
  network: string;
  name: string;
  symbol: string;
  address: string;
  decimals: number;
};

export type CryptoAssetsStore = {
  findTokenByAddress(address: string): TokenCurrency | undefined;
  getTokenById(id: string): TokenCurrency;
  addTokens(list: (TokenCurrency | undefined)[]): void;
  convertERC20(token: ERC20Token): TokenCurrency | undefined;
  findTokenById(id: string): TokenCurrency | undefined;
  findTokenByAddressInCurrency(address: string, currencyId: string): TokenCurrency | undefined;
  findTokenByTicker(ticker: string): TokenCurrency | undefined;
  convertSplTokens(token: SPLToken): TokenCurrency;
};
