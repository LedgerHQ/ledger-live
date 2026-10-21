import type { TokenCurrency } from "@domain/entity-currency-token";
import type { BaseQueryApi, FetchBaseQueryMeta } from "@reduxjs/toolkit/query";
import { calApi, getCalExtra } from "@shared/api-services";
import { ApiTokenResponseSchema } from "./schema";
import {
  type GetTokensDataParams,
  type PageParam,
  type TokenByAddressInCurrencyParams,
  type TokenByIdParams,
  type TokensDataWithPagination,
} from "./types";
import {
  commitHeaderMissingError,
  currencyNotFoundError,
  DEFAULT_PAGE_SIZE,
  HEADER_X_LEDGER_COMMIT,
  snapshotTokenRequests,
  staleTokenQueryKeys,
  type TokenRequestSnapshot,
  type TokenQueryEntry,
  TOKEN_LIST_TAG,
  TOKEN_TAGS,
  transformTokensResponse,
  validateAndTransformSingleTokenResponse,
} from "./internals";

const TOKEN_OUTPUT_FIELDS = Object.keys(ApiTokenResponseSchema.shape);
const TOKENS_PAGE_TIMEOUT_MS = 30_000;

/**
 * CAL token endpoints, injected into the shared CAL service api.
 *
 * `enhanceEndpoints` registers this use case's own cache tags on that api and `injectEndpoints` adds
 * the endpoints — both mutate and return the same api object, so this reference shares its reducer,
 * middleware and cache with every other CAL use case, while only this one is typed with the endpoints
 * below.
 */
export const cryptoAssetsApi = calApi
  .enhanceEndpoints({ addTagTypes: TOKEN_TAGS })
  .injectEndpoints({
    endpoints: build => ({
      findTokenById: build.query<TokenCurrency | undefined, TokenByIdParams>({
        query: params => ({
          url: "/v1/tokens",
          params: {
            id: params.id,
            limit: "1",
            output: TOKEN_OUTPUT_FIELDS.join(","),
          },
        }),
        transformResponse: validateAndTransformSingleTokenResponse,
        providesTags: [...TOKEN_TAGS],
      }),

      findTokenByAddressInCurrency: build.query<
        TokenCurrency | undefined,
        TokenByAddressInCurrencyParams
      >({
        query: params => ({
          url: "/v1/tokens",
          params: {
            contract_address: params.contract_address,
            network: params.network,
            limit: "1",
            output: TOKEN_OUTPUT_FIELDS.join(","),
            ...(params.token_identifier === undefined
              ? {}
              : { token_identifier: params.token_identifier }),
          },
        }),
        transformResponse: validateAndTransformSingleTokenResponse,
        providesTags: [...TOKEN_TAGS],
      }),

      getTokensSyncHash: build.query<string, string>({
        // Stale tokens leave the cache before the new hash enters it, so every saved snapshot
        // pairs a hash with tokens that match it.
        async queryFn(currencyId, api, _extraOptions, baseQuery) {
          const settledTokens = snapshotTokenRequests(cachedQueries(api), currencyId);
          const result = await baseQuery({
            url: "/v1/currencies",
            params: { output: "id", limit: "1", id: currencyId },
          });
          if (result.error) return { error: result.error };

          if (Array.isArray(result.data) && result.data.length === 0) {
            evictStaleTokens(api, settledTokens);
            return currencyNotFoundError(currencyId);
          }

          const meta = result.meta as FetchBaseQueryMeta | undefined;
          const hash = meta?.response?.headers.get(HEADER_X_LEDGER_COMMIT);
          if (!hash) {
            return commitHeaderMissingError();
          }

          const previousHash = cachedQueries(api)[api.queryCacheKey ?? ""]?.data;
          if (typeof previousHash === "string" && previousHash !== hash) {
            getCalExtra(api).logger?.(
              "cryptoassets",
              `Hash changed for currencyId ${currencyId}: ${previousHash} -> ${hash}, evicting token cache`,
            );
            evictStaleTokens(api, settledTokens);
            // Token lists are never saved, so a delayed refresh is enough for them.
            api.dispatch(cryptoAssetsApi.util.invalidateTags([TOKEN_LIST_TAG]));
          }

          return { data: hash };
        },
      }),

      getTokensData: build.infiniteQuery<TokensDataWithPagination, GetTokensDataParams, PageParam>({
        query({ pageParam, queryArg = {} }) {
          const { output, networkFamily, pageSize = DEFAULT_PAGE_SIZE, limit, ref } = queryArg;

          const params = {
            output: output?.join(",") ?? TOKEN_OUTPUT_FIELDS.join(","),
            pageSize,
            ...(pageParam?.cursor && { cursor: pageParam.cursor }),
            ...(networkFamily && { network_family: networkFamily }),
            ...(limit && { limit }),
            ...(ref && { ref }),
          };
          return {
            url: "/v1/tokens",
            params,
            // Pages hold up to 1000 tokens: allow more than the CAL default timeout.
            timeout: TOKENS_PAGE_TIMEOUT_MS,
          };
        },
        providesTags: [TOKEN_LIST_TAG],
        transformResponse: transformTokensResponse,
        infiniteQueryOptions: {
          initialPageParam: {
            cursor: "",
          },
          getNextPageParam: lastPage =>
            lastPage.pagination.nextCursor ? { cursor: lastPage.pagination.nextCursor } : undefined,
        },
      }),
    }),
  });

export const {
  useGetTokensDataInfiniteQuery,
  useFindTokenByIdQuery,
  useFindTokenByAddressInCurrencyQuery,
  useGetTokensSyncHashQuery,
} = cryptoAssetsApi;

export type CryptoAssetsApi = typeof cryptoAssetsApi;

type CachedQueries = Record<string, TokenQueryEntry | undefined>;

function cachedQueries(api: BaseQueryApi): CachedQueries {
  const state = api.getState() as Record<string, { queries?: CachedQueries } | undefined>;
  return state[calApi.reducerPath]?.queries ?? {};
}

function evictStaleTokens(api: BaseQueryApi, settledTokens: TokenRequestSnapshot) {
  for (const queryCacheKey of staleTokenQueryKeys(cachedQueries(api), settledTokens)) {
    api.dispatch(calApi.internalActions.removeQueryResult({ queryCacheKey }));
  }
}
