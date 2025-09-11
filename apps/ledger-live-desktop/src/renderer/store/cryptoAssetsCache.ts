import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { log } from "@ledgerhq/logs";
import { getEnv } from "@ledgerhq/live-env";

/**
 * Types for cache persistence
 */
export interface CachedTokenData {
  id: string;
  data: TokenCurrency;
  timestamp: number;
  expiresAt: number;
}

export interface CryptoAssetsCacheData {
  version: number;
  tokens: Record<string, CachedTokenData>;
  lastUpdated: number;
}

/**
 * Cache configuration
 */
const CACHE_VERSION = 1;
const CACHE_KEY = "ledger-live-crypto-assets-cache";

// Get TTL from environment
function getCacheTTL(): number {
  return getEnv("CRYPTO_ASSETS_CACHE_TTL");
}

/**
 * Simple and typed localStorage cache manager
 */
export class CryptoAssetsCache {
  /**
   * Load cache from localStorage
   */
  static load(): CryptoAssetsCacheData | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: CryptoAssetsCacheData = JSON.parse(cached);

      // Check version
      if (data.version !== CACHE_VERSION) {
        log("crypto-assets-cache", "Cache version mismatch, clearing cache");
        CryptoAssetsCache.clear();
        return null;
      }

      // Clean expired entries
      const now = Date.now();
      const validTokens: Record<string, CachedTokenData> = {};

      for (const [key, token] of Object.entries(data.tokens)) {
        if (token.expiresAt > now) {
          validTokens[key] = token;
        }
      }

      const cleanedData: CryptoAssetsCacheData = {
        ...data,
        tokens: validTokens,
      };

      // Save cleaned data
      CryptoAssetsCache.save(cleanedData);

      log("crypto-assets-cache", `Loaded ${Object.keys(validTokens).length} cached tokens`);
      return cleanedData;
    } catch (error) {
      log("crypto-assets-cache", "Error loading crypto assets cache", { error });
      CryptoAssetsCache.clear();
      return null;
    }
  }

  /**
   * Save cache to localStorage
   */
  static save(data: CryptoAssetsCacheData): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      log("crypto-assets-cache", "Error saving crypto assets cache", { error });
    }
  }

  /**
   * Add a token to cache
   */
  static addToken(tokenId: string, token: TokenCurrency): void {
    const cache = CryptoAssetsCache.load() || CryptoAssetsCache.createEmpty();
    const now = Date.now();

    cache.tokens[tokenId] = {
      id: tokenId,
      data: token,
      timestamp: now,
      expiresAt: now + getCacheTTL(),
    };

    cache.lastUpdated = now;
    CryptoAssetsCache.save(cache);
  }

  /**
   * Get a token from cache
   */
  static getToken(tokenId: string): TokenCurrency | null {
    const cache = CryptoAssetsCache.load();
    if (!cache) return null;

    const cachedToken = cache.tokens[tokenId];
    if (!cachedToken) return null;

    // Check expiration
    if (cachedToken.expiresAt <= Date.now()) {
      return null;
    }

    return cachedToken.data;
  }

  /**
   * Check if a token is in cache and valid
   */
  static hasValidToken(tokenId: string): boolean {
    return CryptoAssetsCache.getToken(tokenId) !== null;
  }

  /**
   * Clear cache
   */
  static clear(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      log("crypto-assets-cache", "Crypto assets cache cleared");
    } catch (error) {
      log("crypto-assets-cache", "Error clearing crypto assets cache", { error });
    }
  }

  /**
   * Create empty cache
   */
  static createEmpty(): CryptoAssetsCacheData {
    return {
      version: CACHE_VERSION,
      tokens: {},
      lastUpdated: Date.now(),
    };
  }

  /**
   * Cache statistics
   */
  static getStats(): {
    tokenCount: number;
    cacheSize: string;
    lastUpdated: Date | null;
  } {
    const cache = CryptoAssetsCache.load();
    if (!cache) {
      return {
        tokenCount: 0,
        cacheSize: "0 KB",
        lastUpdated: null,
      };
    }

    // Get size directly from localStorage without re-stringifying
    let sizeInBytes = 0;
    try {
      const storedData = localStorage.getItem(CACHE_KEY);
      if (storedData) {
        sizeInBytes = new TextEncoder().encode(storedData).length;
      }
    } catch (error) {
      log("crypto-assets-cache", "Error getting cache size", { error });
    }

    const sizeInKB = (sizeInBytes / 1024).toFixed(2);

    return {
      tokenCount: Object.keys(cache.tokens).length,
      cacheSize: `${sizeInKB} KB`,
      lastUpdated: new Date(cache.lastUpdated),
    };
  }
}
