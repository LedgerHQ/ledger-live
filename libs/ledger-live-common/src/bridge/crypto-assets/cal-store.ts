import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

export class CALStore implements CryptoAssetsStore {
  private tokenCache = new Map<string, TokenCurrency>();
  private addressCache = new Map<string, TokenCurrency>();
  private tickerCache = new Map<string, TokenCurrency>();

  addTokens(tokens: TokenCurrency[]) {
    tokens.forEach(token => {
      this.tokenCache.set(token.id, token);
      if (token.contractAddress) {
        this.addressCache.set(token.contractAddress, token);
      }
      this.tickerCache.set(token.ticker, token);
    });
  }

  findTokenByAddress(address: string): TokenCurrency | undefined {
    return this.addressCache.get(address);
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
    const token = this.addressCache.get(address);
    if (token && token.parentCurrency.id === currencyId) {
      return token;
    }
    return undefined;
  }

  findTokenByTicker(ticker: string): TokenCurrency | undefined {
    return this.tickerCache.get(ticker);
  }
}
