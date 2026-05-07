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
   * @param tokenIdentifier - Optional discriminator for chains where contract_address alone is not
   *   unique (e.g. MultiversX ESDT identifier, Cardano asset policy+name, Algorand asset ID,
   *   Stellar classic asset code+issuer). When provided, it is forwarded as `token_identifier`
   *   in the CAL query so the correct token is returned. Omit only for chains where address
   *   uniquely identifies a token (e.g. EVM).
   * @returns Promise resolving to the TokenCurrency if found, undefined otherwise
   * @example
   * ```typescript
   * const polygonUsdc = await store.findTokenByAddressInCurrency(
   *   "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
   *   "polygon"
   * );
   * // MultiversX — token_identifier needed to disambiguate
   * const mxToken = await store.findTokenByAddressInCurrency(
   *   "EGLD-abc123",
   *   "elrond",
   *   "MYTOKEN-def456"
   * );
   * ```
   */
  findTokenByAddressInCurrency(
    address: string,
    currencyId: string,
    tokenIdentifier?: string,
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
