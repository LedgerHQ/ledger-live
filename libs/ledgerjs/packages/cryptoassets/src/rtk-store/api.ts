import { createApi } from "@reduxjs/toolkit/query/react";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "../currencies";
import { log } from "@ledgerhq/logs";
import { z } from "zod";
import { createPersistentBaseQuery, HttpCacheResult } from "@ledgerhq/live-persistence";
import type { CacheAdapter } from "@ledgerhq/live-persistence";

/**
 * Zod schema for API token response
 */
export const ApiTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  ticker: z.string(),
  contract_address: z.string(),
  network: z.string(),
  standard: z.string(),
  decimals: z.number().optional(),
  live_signature: z.string().optional(),
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

/**
 * Zod schema for API response (array of tokens)
 */
export const ApiResponseSchema = z.array(ApiTokenSchema);

/**
 * Inferred types from Zod schemas
 */
export type ApiTokenResponse = z.infer<typeof ApiTokenSchema>;

/**
 * Query parameters for token lookups
 */
export interface TokenByIdParams {
  id: string;
}

export interface TokenByAddressInCurrencyParams {
  contract_address: string;
  network: string;
}

function transformApiTokenToTokenCurrency(token: ApiTokenResponse): TokenCurrency | undefined {
  const parentCurrency = findCryptoCurrencyById(token.network);
  if (!parentCurrency) {
    log("crypto-assets-api", `Parent currency not found for network: ${token.network}`);
    return undefined;
  }

  return {
    type: "TokenCurrency",
    id: token.id,
    ledgerSignature: token.live_signature,
    contractAddress: token.contract_address,
    parentCurrency,
    tokenType: token.standard,
    name: token.name,
    ticker: token.ticker,
    units: token.units.map(unit => ({
      code: unit.code,
      name: unit.name,
      magnitude: unit.magnitude,
    })),
  };
}

function validateAndTransformResponse(response: unknown): TokenCurrency | undefined {
  const validatedResponse = ApiResponseSchema.parse(response);
  const token = validatedResponse[0];
  if (!token) {
    return undefined;
  }
  return transformApiTokenToTokenCurrency(token);
}

function createTokenQuery(params: Record<string, string>) {
  return {
    url: "/v1/tokens",
    params: {
      ...params,
      limit: "1",
      output:
        "id,name,ticker,contract_address,standard,network,network_family,units,type,live_signature",
    },
  };
}

export interface CryptoAssetsApiConfig {
  baseUrl: string;
  cacheAdapter: CacheAdapter<HttpCacheResult>;
  clientVersion: string; // Version of the client using the API to set in header
}

export function createCryptoAssetsApi(config: CryptoAssetsApiConfig) {
  const { baseUrl, cacheAdapter, clientVersion } = config;
  return createApi({
    reducerPath: "cryptoAssetsApi",
    baseQuery: createPersistentBaseQuery({
      baseUrl,
      cacheAdapter,
      clientVersion,
      validateAndTransformResponse,
    }),
    tagTypes: ["Token"],
    keepUnusedDataFor: cacheAdapter.ttl,
    endpoints: builder => ({
      findTokenById: builder.query<TokenCurrency | undefined, TokenByIdParams>({
        query: params => {
          return createTokenQuery({ id: params.id });
        },
        providesTags: ["Token"],
      }),

      findTokenByAddressInCurrency: builder.query<
        TokenCurrency | undefined,
        TokenByAddressInCurrencyParams
      >({
        query: params => {
          return createTokenQuery({
            contract_address: params.contract_address,
            network: params.network,
          });
        },
        providesTags: ["Token"],
      }),
    }),
  });
}

export type CryptoAssetsApi = ReturnType<typeof createCryptoAssetsApi>;
