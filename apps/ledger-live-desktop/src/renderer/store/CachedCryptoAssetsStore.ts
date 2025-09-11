import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { CryptoAssetsStore } from "@ledgerhq/types-live";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { CryptoAssetsCache } from "./cryptoAssetsCache";
import { log } from "@ledgerhq/logs";
import { getEnv } from "@ledgerhq/live-env";
import { z } from "zod";
import type { Store } from "@reduxjs/toolkit";

// Zod schema for API token response
const ApiTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  ticker: z.string(),
  contract_address: z.string(),
  network: z.string(),
  standard: z.string(),
  decimals: z.number(),
  units: z
    .array(
      z.object({
        code: z.string(),
        name: z.string(),
        magnitude: z.number(),
      }),
    )
    .min(1),
});

// Zod schema for API response (array of tokens)
const ApiResponseSchema = z.array(ApiTokenSchema);

export class CachedCryptoAssetsStore implements CryptoAssetsStore {
  private get baseUrl(): string {
    return getEnv("CAL_SERVICE_URL");
  }

  constructor(_store: Store) {}

  private convertApiTokenToTokenCurrency(
    token: z.infer<typeof ApiTokenSchema>,
  ): TokenCurrency | undefined {
    const tokenData = token;

    const parentCurrency = findCryptoCurrencyById(tokenData.network);
    if (!parentCurrency) {
      log("crypto-assets-cache", `Parent currency not found for network: ${tokenData.network}`);
      return undefined;
    }

    return {
      type: "TokenCurrency" as const,
      id: tokenData.id,
      name: tokenData.name,
      ticker: tokenData.ticker,
      contractAddress: tokenData.contract_address,
      parentCurrency,
      tokenType: tokenData.standard,
      units: tokenData.units,
    };
  }

  private async fetchFromApi(
    endpoint: string,
    params: Record<string, string> = {},
  ): Promise<z.infer<typeof ApiTokenSchema>[]> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    const defaultParams = {
      output: "id,name,ticker,contract_address,standard,decimals,network,network_family,units,type",
      ...params,
    };

    Object.entries(defaultParams).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawData = await response.json();

      // Validate with Zod schema
      const parseResult = ApiResponseSchema.safeParse(rawData);
      if (!parseResult.success) {
        log("crypto-assets-cache", `Invalid API response from ${endpoint}`, {
          error: parseResult.error,
        });
        throw new Error("Invalid API response format");
      }

      return parseResult.data;
    } catch (error) {
      log("crypto-assets-cache", `Error fetching from ${endpoint}`, { error });
      throw error;
    }
  }

  async findTokenByAddress(address: string): Promise<TokenCurrency | undefined> {
    const cacheKey = `address:${address}`;
    const cached = CryptoAssetsCache.getToken(cacheKey);
    if (cached) {
      log("crypto-assets-cache", `Cache hit for ${cacheKey}`);
      return cached;
    }

    try {
      const tokens = await this.fetchFromApi("/v1/tokens", {
        contract_address: address,
        limit: "1",
      });
      if (tokens.length === 0) return undefined;

      const result = this.convertApiTokenToTokenCurrency(tokens[0]);

      if (result) {
        CryptoAssetsCache.addToken(cacheKey, result);
        log("crypto-assets-cache", `Cached ${cacheKey}`);
      }

      return result;
    } catch (error) {
      log("crypto-assets-cache", `Error fetching ${cacheKey}`, { error });
      return undefined;
    }
  }

  async getTokenById(id: string): Promise<TokenCurrency> {
    const token = await this.findTokenById(id);
    if (!token) {
      throw new Error(`Token with id ${id} not found`);
    }
    return token;
  }

  async findTokenById(id: string): Promise<TokenCurrency | undefined> {
    const cacheKey = `id:${id}`;
    const cached = CryptoAssetsCache.getToken(cacheKey);
    if (cached) {
      log("crypto-assets-cache", `Cache hit for ${cacheKey}`);
      return cached;
    }

    try {
      const tokens = await this.fetchFromApi("/v1/tokens", {
        id,
        limit: "1",
      });
      if (tokens.length === 0) return undefined;

      const result = this.convertApiTokenToTokenCurrency(tokens[0]);

      if (result) {
        CryptoAssetsCache.addToken(cacheKey, result);
        log("crypto-assets-cache", `Cached ${cacheKey}`);
      }

      return result;
    } catch (error) {
      log("crypto-assets-cache", `Error fetching ${cacheKey}`, { error });
      return undefined;
    }
  }

  async findTokenByAddressInCurrency(
    address: string,
    currencyId: string,
  ): Promise<TokenCurrency | undefined> {
    const cacheKey = `address:${address}:currency:${currencyId}`;
    const cached = CryptoAssetsCache.getToken(cacheKey);
    if (cached) {
      log("crypto-assets-cache", `Cache hit for ${cacheKey}`);
      return cached;
    }

    try {
      const tokens = await this.fetchFromApi("/v1/tokens", {
        contract_address: address,
        network: currencyId,
        limit: "1",
      });
      if (tokens.length === 0) return undefined;

      const result = this.convertApiTokenToTokenCurrency(tokens[0]);

      if (result) {
        CryptoAssetsCache.addToken(cacheKey, result);
        log("crypto-assets-cache", `Cached ${cacheKey}`);
      }

      return result;
    } catch (error) {
      log("crypto-assets-cache", `Error fetching ${cacheKey}`, { error });
      return undefined;
    }
  }

  async findTokenByTicker(ticker: string): Promise<TokenCurrency | undefined> {
    const cacheKey = `ticker:${ticker}`;
    const cached = CryptoAssetsCache.getToken(cacheKey);
    if (cached) {
      log("crypto-assets-cache", `Cache hit for ${cacheKey}`);
      return cached;
    }
    try {
      const tokens = await this.fetchFromApi("/v1/tokens", {
        ticker,
        limit: "1",
      });
      if (tokens.length === 0) return undefined;
      const result = this.convertApiTokenToTokenCurrency(tokens[0]);
      if (result) {
        CryptoAssetsCache.addToken(cacheKey, result);
      }

      return result;
    } catch (error) {
      log("crypto-assets-cache", `Error fetching ${cacheKey}`, { error });
      return undefined;
    }
  }
}
