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
   * Finds a token by its contract address across all supported currencies.
   *
   * @param address - The contract address of the token to find
   * @returns Promise resolving to the TokenCurrency if found, undefined otherwise
   * @example
   * ```typescript
   * const usdc = await store.findTokenByAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
   * ```
   */
  findTokenByAddress(address: string): Promise<TokenCurrency | undefined>;

  /**
   * Retrieves a token by its unique identifier.
   *
   * @deprecated This method should not be implemented directly in CryptoAssetsStore.
   * Use findTokenById instead and handle the undefined case appropriately.
   * A wrapper around findTokenById should be used when a non-undefined result is expected.
   *
   * @param id - The unique identifier of the token (e.g., "ethereum/erc20/usd_coin")
   * @returns Promise resolving to the TokenCurrency
   * @throws Error if the token is not found
   * @example
   * ```typescript
   * const usdc = await store.getTokenById("ethereum/erc20/usd_coin");
   * ```
   */
  getTokenById(id: string): Promise<TokenCurrency>;

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
   * Finds a token by its ticker symbol.
   *
   * @warning This method should be used with caution as ticker symbols are not unique
   * across different blockchains and networks. Multiple tokens may share the same ticker.
   * Consider using findTokenById or findTokenByAddressInCurrency for more precise results.
   *
   * @param ticker - The ticker symbol of the token (e.g., "USDC", "USDT")
   * @returns Promise resolving to the first TokenCurrency found with the given ticker, undefined if none found
   * @example
   * ```typescript
   * // Warning: This may return any USDC token (Ethereum, Polygon, etc.)
   * const usdc = await store.findTokenByTicker("USDC");
   * ```
   */
  findTokenByTicker(ticker: string): Promise<TokenCurrency | undefined>;
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
