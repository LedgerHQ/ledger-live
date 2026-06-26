import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import {
  type GetTokensDataParams,
  type PageParam,
  type TokenByAddressInCurrencyParams,
  type TokenByIdParams,
  type TokensDataWithPagination,
} from "./types";
import {
  CAL_REDUCER_PATH,
  DEFAULT_PAGE_SIZE,
  HEADER_X_LEDGER_CLIENT_VERSION,
  HEADER_X_LEDGER_COMMIT,
  MAX_RETRIES,
  TOKEN_OUTPUT_FIELDS,
  TOKEN_TAGS,
  transformTokensResponse,
  validateAndTransformSingleTokenResponse,
} from "./internals";

/**
 * Thunk `extraArgument` contract for {@link cryptoAssetsApi}. The app supplies the resolved CAL
 * service URL, client version and an optional logger at store configuration time, so this package
 * owns no env/config/logging dependency. The app picks the prod or staging URL — there is no
 * staging switch in here.
 */
export interface CalApiExtra {
  calServiceUrl: string;
  ledgerClientVersion: string;
  logger?: (...args: unknown[]) => void;
}

/**
 * Builds this package's slice of the thunk `extraArgument`. RTK leaves `extraArgument` untyped, so
 * this is the one compile-checked entry point ensuring the CAL config is complete and correctly named.
 */
export function calApiExtra(extra: CalApiExtra): CalApiExtra {
  return extra;
}

/** Reads the injected {@link CalApiExtra} and delegates to {@link fetchBaseQuery}. Wrapped in `retry`. */
const calBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = retry(
  (args, api, extraOptions) => {
    const extra = api.extra as CalApiExtra;
    return fetchBaseQuery({
      baseUrl: extra.calServiceUrl,
      prepareHeaders: headers => {
        headers.set("Content-Type", "application/json");
        headers.set(HEADER_X_LEDGER_CLIENT_VERSION, extra.ledgerClientVersion);
        return headers;
      },
    })(args, api, extraOptions);
  },
  { maxRetries: MAX_RETRIES },
);

/** RTK Query API for the Crypto Asset List (CAL) token data. */
export const cryptoAssetsApi = createApi({
  reducerPath: CAL_REDUCER_PATH,
  baseQuery: calBaseQuery,
  tagTypes: [...TOKEN_TAGS],
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
      async queryFn(currencyId, queryApi) {
        const extra = queryApi.extra as CalApiExtra;
        try {
          const url = new URL("/v1/currencies", extra.calServiceUrl);
          url.searchParams.set("output", "id");
          url.searchParams.set("limit", "1");
          url.searchParams.set("id", currencyId);

          const response = await fetch(url, {
            headers: {
              "Content-Type": "application/json",
              [HEADER_X_LEDGER_CLIENT_VERSION]: extra.ledgerClientVersion,
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

          const hash = response.headers.get(HEADER_X_LEDGER_COMMIT);

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
      async onQueryStarted(currencyId, { dispatch, queryFulfilled, getCacheEntry, extra }) {
        try {
          const previousHash = getCacheEntry()?.data as string | undefined;
          const { data: newHash } = await queryFulfilled;

          if (previousHash && newHash && previousHash !== newHash) {
            (extra as CalApiExtra).logger?.(
              "cryptoassets",
              `Hash changed for currencyId ${currencyId}: ${previousHash} -> ${newHash}, evicting token cache`,
            );
            dispatch(cryptoAssetsApi.util.invalidateTags([...TOKEN_TAGS]));
          }
        } catch {
          // Query failed, skip eviction
        }
      },
    }),

    getTokensData: build.infiniteQuery<TokensDataWithPagination, GetTokensDataParams, PageParam>({
      query: ({ pageParam, queryArg = {} }) => {
        const { output, networkFamily, pageSize = DEFAULT_PAGE_SIZE, limit, ref } = queryArg;

        const params = {
          output: output?.join(",") || TOKEN_OUTPUT_FIELDS.join(","),
          ...(pageParam?.cursor && { cursor: pageParam.cursor }),
          ...(networkFamily && { network_family: networkFamily }),
          pageSize,
          ...(limit && { limit }),
          ...(ref && { ref }),
        };

        return {
          url: "/v1/tokens",
          params,
        };
      },
      providesTags: [...TOKEN_TAGS],
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
