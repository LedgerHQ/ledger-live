import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { ApiTokenResponseSchema, CalApiExtraSchema } from "./schema";
import {
  type CalApiExtra,
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
  TOKEN_TAGS,
  commitHeaderMissingError,
  currencyNotFoundError,
  fetchCurrencyError,
  fetchError,
  transformTokensResponse,
  validateAndTransformSingleTokenResponse,
} from "./internals";

const TOKEN_OUTPUT_FIELDS = Object.keys(ApiTokenResponseSchema.shape);

/**
 * Builds this package's slice of the thunk `extraArgument`. RTK leaves `extraArgument` untyped, so
 * this is the one compile- and runtime-checked entry point: `parse` fails fast at app init if the CAL
 * config is incomplete (e.g. an env var resolved to an empty string).
 */
export function calApiExtra(extra: CalApiExtra): CalApiExtra {
  return CalApiExtraSchema.parse(extra);
}

/** Extracts the {@link CalApiExtra} from the `extraArgument` of the API. */
function getCalExtra(api: { extra: unknown }): CalApiExtra {
  return api.extra as CalApiExtra;
}

/** Reads the injected {@link CalApiExtra} and delegates to {@link fetchBaseQuery}. Wrapped in `retry`. */
const calBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = retry(
  (args, api, extraOptions) => {
    const extra = getCalExtra(api);
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
        const extra = getCalExtra(queryApi);
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
            return fetchCurrencyError(response.status, response.statusText);
          }

          // Check if the response contains data (not an empty array)
          const responseData = await response.json();
          if (Array.isArray(responseData) && responseData.length === 0) {
            return currencyNotFoundError(currencyId);
          }

          const hash = response.headers.get(HEADER_X_LEDGER_COMMIT);

          if (!hash) {
            return commitHeaderMissingError();
          }

          return { data: hash };
        } catch (error) {
          return fetchError(error);
        }
      },
      async onQueryStarted(currencyId, api) {
        const extra = getCalExtra(api);
        try {
          const previousHash = api.getCacheEntry()?.data as string | undefined;
          const { data: newHash } = await api.queryFulfilled;

          if (previousHash && newHash && previousHash !== newHash) {
            extra.logger?.(
              "cryptoassets",
              `Hash changed for currencyId ${currencyId}: ${previousHash} -> ${newHash}, evicting token cache`,
            );
            api.dispatch(cryptoAssetsApi.util.invalidateTags([...TOKEN_TAGS]));
          }
        } catch {
          // Query failed, skip eviction
        }
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
