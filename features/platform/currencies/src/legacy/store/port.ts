import type { TokenCurrency } from "@domain/entity-currency-token";

/**
 * App-facing port for crypto-assets token lookups.
 *
 * Defined locally (NOT imported from `@ledgerhq/types-live`) and typed on the
 * domain `TokenCurrency`. Apps inject a concrete implementation — built by
 * `buildCryptoAssetsStore` — through the legacy `setCryptoAssetsStore` singleton,
 * preserving the `getCryptoAssetsStore()` contract for the coin-module callers.
 */
export interface CryptoAssetsStore {
  findTokenById(id: string): Promise<TokenCurrency | undefined>;
  findTokenByAddressInCurrency(
    address: string,
    currencyId: string,
    tokenIdentifier?: string,
  ): Promise<TokenCurrency | undefined>;
  getTokensSyncHash(currencyId: string): Promise<string>;
}
