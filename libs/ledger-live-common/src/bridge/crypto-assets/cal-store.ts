import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

// Coins with case-sensitive addresses (b58, ...)
const CASE_SENSITIVE_COINS = ["solana"];

export class CALStore implements CryptoAssetsStore {
  private tokenCache = new Map<string, TokenCurrency>();
  private addressCache = new Map<string, TokenCurrency>();
  private tickerCache = new Map<string, TokenCurrency>();

  addTokens(tokens: TokenCurrency[]) {
    tokens.forEach(token => {
      this.tokenCache.set(token.id, token);
      if (token.contractAddress) {
        const isCaseSensitive = CASE_SENSITIVE_COINS.includes(token.parentCurrency.id);
        const normalizedAddress = isCaseSensitive
          ? token.contractAddress
          : token.contractAddress.toLowerCase();
        this.addressCache.set(normalizedAddress, token);
      }
      this.tickerCache.set(token.ticker, token);
    });
  }

  findTokenByAddress(address: string): TokenCurrency | undefined {
    const exactMatch = this.addressCache.get(address);
    if (exactMatch) return exactMatch;

    const lowercaseMatch = this.addressCache.get(address.toLowerCase());
    return lowercaseMatch;
  }

  getTokenById(id: string): TokenCurrency {
    const token = this.tokenCache.get(id);
    if (!token) {
      throw new Error(`Token not found: ${id}`);
    }
    return token;
  }

  findTokenById(id: string): TokenCurrency | undefined {
    return this.tokenCache.get(id);
  }

  findTokenByAddressInCurrency(address: string, currencyId: string): TokenCurrency | undefined {
    const isCaseSensitive = CASE_SENSITIVE_COINS.includes(currencyId);

    if (isCaseSensitive) {
      const token = this.addressCache.get(address);
      if (token && token.parentCurrency.id === currencyId) return token;
      return undefined;
    }

    const token = this.addressCache.get(address.toLowerCase());
    if (token && token.parentCurrency.id === currencyId) return token;
    return undefined;
  }

  findTokenByTicker(ticker: string): TokenCurrency | undefined {
    return this.tickerCache.get(ticker);
  }
}
