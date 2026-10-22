import type { TokenCurrency } from "./types";

export type FrameworkCryptoAssetsStore = {
  findTokenById(tokenId: string): Promise<TokenCurrency | undefined>;
  findTokenByAddressInCurrency(
    address: string,
    currencyId: string,
    tokenIdentifier?: string,
  ): Promise<TokenCurrency | undefined>;
  /**
   * Optional so stores that never serve such a lookup (test doubles) need not stub it; the CAL-backed
   * stores the apps install implement it, and a caller that needs it fails without it.
   */
  findTokenByTokenIdentifierInCurrency?(
    tokenIdentifier: string,
    currencyId: string,
  ): Promise<TokenCurrency | undefined>;
  getTokensSyncHash(currencyId: string): Promise<string>;
};

let current: FrameworkCryptoAssetsStore | undefined;

export function setCryptoAssetsStore(store: FrameworkCryptoAssetsStore): void {
  current = store;
}

export function getCryptoAssetsStore(): FrameworkCryptoAssetsStore {
  if (!current) {
    throw new Error(
      "Framework crypto assets store not initialized. Call setCryptoAssetsStore() at bootstrap.",
    );
  }
  return current;
}
