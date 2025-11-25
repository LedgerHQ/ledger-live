import { createApi, fetchBaseQuery, FetchBaseQueryMeta, retry } from "@reduxjs/toolkit/query/react";
import type { ApiTokenResponse } from "../entities";
import { ApiTokenResponseSchema } from "../entities";
import { getEnv } from "@ledgerhq/live-env";
import { GetTokensDataParams, PageParam, TokensDataTags, TokensDataWithPagination } from "./types";
import { TOKEN_OUTPUT_FIELDS } from "./fields";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { convertApiToken, legacyIdToApiId } from "../../api-token-converter";
import { z } from "zod";

/**
 * Zod schema for API response (array of tokens)
 * Re-using the schema from entities
 */
export const ApiResponseSchema = z.array(ApiTokenResponseSchema);

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

function transformTokensResponse(
  response: ApiTokenResponse[],
  meta?: FetchBaseQueryMeta,
): TokensDataWithPagination {
  const nextCursor = meta?.response?.headers.get("x-ledger-next") || undefined;

  return {
    tokens: response.flatMap(token => {
      const result = transformApiTokenToTokenCurrency(token);
      return result ? [result] : [];
    }),
    pagination: {
      nextCursor,
    },
  };
}

function transformApiTokenToTokenCurrency(token: ApiTokenResponse): TokenCurrency | undefined {
  // convertApiToken handles all format reconciliation internally
  const result = convertApiToken({
    id: token.id,
    contractAddress: token.contract_address,
    name: token.name,
    ticker: token.ticker,
    units: token.units,
    standard: token.standard,
    tokenIdentifier: token.token_identifier,
    delisted: token.delisted,
    ledgerSignature: token.live_signature,
  });

  return result;
}

function validateAndTransformSingleTokenResponse(response: unknown): TokenCurrency | undefined {
  const validatedResponse = ApiResponseSchema.parse(response);
  const apiToken = validatedResponse[0];
  if (!apiToken) {
    return undefined;
  }
  const result = convertApiToken({
    id: apiToken.id,
    contractAddress: apiToken.contract_address,
    name: apiToken.name,
    ticker: apiToken.ticker,
    units: apiToken.units,
    standard: apiToken.standard,
    tokenIdentifier: apiToken.token_identifier,
    delisted: apiToken.delisted,
    ledgerSignature: apiToken.live_signature,
  });

  return result;
}

const baseQueryWithRetry = retry(
  fetchBaseQuery({
    baseUrl: "",
    prepareHeaders: headers => {
      headers.set("Content-Type", "application/json");
      headers.set("X-Ledger-Client-Version", getEnv("LEDGER_CLIENT_VERSION"));
      return headers;
    },
  }),
  {
    maxRetries: 3,
  },
);

export const cryptoAssetsApi = createApi({
  reducerPath: "cryptoAssetsApi",
  baseQuery: baseQueryWithRetry,
  tagTypes: [TokensDataTags.Tokens],
  endpoints: build => ({
    findTokenById: build.query<TokenCurrency | undefined, TokenByIdParams>({
      query: params => {
        const baseUrl = getEnv("CAL_SERVICE_URL");
        // Transform legacy ID to API format before querying
        const apiId = legacyIdToApiId(params.id);
        return {
          url: `${baseUrl}/v1/tokens`,
          params: {
            id: apiId,
            limit: "1",
            output: TOKEN_OUTPUT_FIELDS.join(","),
          },
        };
      },
      transformResponse: validateAndTransformSingleTokenResponse,
      providesTags: [TokensDataTags.Tokens],
    }),

    findTokenByAddressInCurrency: build.query<
      TokenCurrency | undefined,
      TokenByAddressInCurrencyParams
    >({
      query: params => {
        const baseUrl = getEnv("CAL_SERVICE_URL");
        return {
          url: `${baseUrl}/v1/tokens`,
          params: {
            contract_address: params.contract_address,
            network: params.network,
            limit: "1",
            output: TOKEN_OUTPUT_FIELDS.join(","),
          },
        };
      },
      transformResponse: validateAndTransformSingleTokenResponse,
      providesTags: [TokensDataTags.Tokens],
    }),

    getTokensSyncHash: build.query<string, string>({
      queryFn: async currencyId => {
        try {
          const baseUrl = getEnv("CAL_SERVICE_URL");
          const url = new URL("/v1/currencies", baseUrl);
          url.searchParams.set("output", "id");
          url.searchParams.set("limit", "1");
          url.searchParams.set("id", currencyId);

          const response = await fetch(url.toString(), {
            headers: {
              "Content-Type": "application/json",
              "X-Ledger-Client-Version": getEnv("LEDGER_CLIENT_VERSION"),
            },
          });

          if (!response.ok) {
            return {
              error: {
                status: response.status,
                data: `Failed to fetch currency: ${response.statusText}`,
                originalStatus: response.status,
              },
            };
          }

          // Check if the response contains data (not an empty array)
          const responseData = await response.json();
          if (Array.isArray(responseData) && responseData.length === 0) {
            return {
              error: {
                status: 404,
                data: `Currency not found: ${currencyId}`,
                originalStatus: 404,
              },
            };
          }

          // Extract X-Ledger-Commit header from the response
          const hash = response.headers.get("X-Ledger-Commit");

          if (!hash) {
            return {
              error: {
                status: "PARSING_ERROR",
                data: "X-Ledger-Commit header not found in response",
                error: "X-Ledger-Commit header not found in response",
                originalStatus: 200,
              },
            };
          }

          return { data: hash };
        } catch (error) {
          return {
            error: {
              status: "FETCH_ERROR",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          };
        }
      },
    }),

    getTokensData: build.infiniteQuery<TokensDataWithPagination, GetTokensDataParams, PageParam>({
      query: ({ pageParam, queryArg = {} }) => {
        const { isStaging = false, output, networkFamily, pageSize = 1000, limit, ref } = queryArg;

        const params = {
          output: output?.join(",") || TOKEN_OUTPUT_FIELDS.join(","),
          ...(pageParam?.cursor && { cursor: pageParam.cursor }),
          ...(networkFamily && { network_family: networkFamily }),
          pageSize,
          ...(limit && { limit }),
          ...(ref && { ref }),
        };

        const baseUrl = isStaging ? getEnv("CAL_SERVICE_URL_STAGING") : getEnv("CAL_SERVICE_URL");

        return {
          url: `${baseUrl}/v1/tokens`,
          params,
        };
      },
      providesTags: [TokensDataTags.Tokens],
      transformResponse: transformTokensResponse,
      infiniteQueryOptions: {
        initialPageParam: {
          cursor: "",
        },
        getNextPageParam: lastPage => {
          if (lastPage.pagination.nextCursor) {
            return {
              cursor: lastPage.pagination.nextCursor,
            };
          }
          return undefined;
        },
      },
    }),
  }),
});

export const {
  useGetTokensDataInfiniteQuery,
  useFindTokenByIdQuery,
  useFindTokenByAddressInCurrencyQuery,
  useGetTokensSyncHashQuery,
  endpoints,
} = cryptoAssetsApi;

export type CryptoAssetsApi = typeof cryptoAssetsApi;

// Export internal functions for testing purposes
export {
  transformTokensResponse,
  transformApiTokenToTokenCurrency,
  validateAndTransformSingleTokenResponse,
};
