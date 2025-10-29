import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

/**
 * CryptoAssetsStore provides access to cryptocurrency and token data.
 *
 * ⚠️ IMPORTANT: This interface is transitioning to async in the future.
 * All methods will return Promises to support API-based implementations.
 * Please prepare your code to handle async operations.
 *
 * @interface CryptoAssetsStore
 */
export type CryptoAssetsStore = {
  /**
   * Finds a token by its unique identifier.
   * This is the preferred method for token lookup as it gracefully handles missing tokens.
   *
   * 🔮 FUTURE: Will become async and return Promise<TokenCurrency | undefined>
   *
   * @param id - The unique identifier of the token (e.g., "ethereum/erc20/usd_coin")
   * @returns The TokenCurrency if found, undefined otherwise
   * @example
   * ```typescript
   * // Current usage
   * const usdc = store.findTokenById("ethereum/erc20/usd_coin");
   *
   * // Future usage (prepare for this)
   * const usdc = await store.findTokenById("ethereum/erc20/usd_coin");
   * if (usdc) {
   *   console.log(`Found token: ${usdc.name}`);
   * }
   * ```
   */
  findTokenById(id: string): TokenCurrency | undefined;

  /**
   * Finds a token by its contract address within a specific parent currency.
   * This method provides more precise results by scoping the search to a particular blockchain.
   *
   * 🔮 FUTURE: Will become async and return Promise<TokenCurrency | undefined>
   *
   * @param address - The contract address of the token
   * @param currencyId - The ID of the parent currency/blockchain (e.g., "ethereum", "polygon")
   * @returns The TokenCurrency if found, undefined otherwise
   * @example
   * ```typescript
   * // Current usage
   * const polygonUsdc = store.findTokenByAddressInCurrency(
   *   "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
   *   "polygon"
   * );
   *
   * // Future usage (prepare for this)
   * const polygonUsdc = await store.findTokenByAddressInCurrency(
   *   "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
   *   "polygon"
   * );
   * ```
   */
  findTokenByAddressInCurrency(address: string, currencyId: string): TokenCurrency | undefined;

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

export type CryptoAssetsStoreGetter = () => CryptoAssetsStore;
