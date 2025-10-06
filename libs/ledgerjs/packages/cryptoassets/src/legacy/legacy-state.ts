import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

// Legacy state variables that are used for the legacy implementation of CryptoAssetsStore contract
export const tokensArray: TokenCurrency[] = [];
export const tokensArrayWithDelisted: TokenCurrency[] = [];
export const tokensByCryptoCurrency: Record<string, TokenCurrency[]> = {};
export const tokensByCryptoCurrencyWithDelisted: Record<string, TokenCurrency[]> = {};
export const tokensById: Record<string, TokenCurrency> = {};
export const tokensByCurrencyAddress: Record<string, TokenCurrency> = {};
export const tokenListHashes = new Set();
