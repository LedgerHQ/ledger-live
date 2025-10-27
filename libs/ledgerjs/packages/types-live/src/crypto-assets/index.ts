import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

/**
 * CryptoAssetsStore provides asynchronous access to cryptocurrency and token data.
 * This interface is designed to be compatible with API-based implementations where
 * crypto asset data may be fetched from remote sources.
 *
 * @interface CryptoAssetsStore
 */
export type CryptoAssetsStore = {
  /**
   * Finds a token by its unique identifier.
   * This is the preferred method for token lookup as it gracefully handles missing tokens.
   *
   * @param id - The unique identifier of the token (e.g., "ethereum/erc20/usd_coin")
   * @returns Promise resolving to the TokenCurrency if found, undefined otherwise
   * @example
   * ```typescript
   * const usdc = await store.findTokenById("ethereum/erc20/usd_coin");
   * if (usdc) {
   *   console.log(`Found token: ${usdc.name}`);
   * }
   * ```
   */
  findTokenById(id: string): Promise<TokenCurrency | undefined>;

  /**
   * Finds a token by its contract address within a specific parent currency.
   * This method provides more precise results by scoping the search to a particular blockchain.
   *
   * @param address - The contract address of the token
   * @param currencyId - The ID of the parent currency/blockchain (e.g., "ethereum", "polygon")
   * @returns Promise resolving to the TokenCurrency if found, undefined otherwise
   * @example
   * ```typescript
   * const polygonUsdc = await store.findTokenByAddressInCurrency(
   *   "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
   *   "polygon"
   * );
   * ```
   */
  findTokenByAddressInCurrency(
    address: string,
    currencyId: string,
  ): Promise<TokenCurrency | undefined>;

  /**
   * Gets a sync hash representing the current state of tokens for a given currency.
   * This hash can be used to detect changes in the token list for a currency.
   *
   * @param currencyId - The ID of the parent currency/blockchain (e.g., "ethereum", "polygon")
   * @returns A promise that resolves to a string hash representing the current token state
   * @example
   * ```typescript
   * const hash = await store.getTokensSyncHash("ethereum");
   * console.log(`Ethereum tokens hash: ${hash}`);
   * ```
   */
  getTokensSyncHash(currencyId: string): Promise<string>;
};

/**
 * Factory function type for obtaining a CryptoAssetsStore instance.
 * This pattern allows for lazy initialization and dependency injection of the store.
 *
 * @example
 * ```typescript
 * const getStore: CryptoAssetsStoreGetter = () => {
 *   return new ApiCryptoAssetsStore({ apiUrl: "https://api.example.com" });
 * };
 *
 * // Later in your code
 * const store = getStore();
 * const token = await store.findTokenById("ethereum/erc20/usd_coin");
 * ```
 */
export type CryptoAssetsStoreGetter = () => CryptoAssetsStore;
