import type { TokenCurrency } from "@domain/entity-currency-token";
import { calApi, getCalExtra, HEADER_X_LEDGER_CLIENT_VERSION } from "@shared/api-services";
import { ApiNetworkTokenListHashResponseSchema, ApiTokenResponseSchema } from "./schema";
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
  EMPTY_TOKEN_LIST_HASH,
  fetchCurrencyError,
  fetchError,
  fetchNetworkError,
  HEADER_X_LEDGER_COMMIT,
  invalidNetworkResponseError,
  networkNotFoundError,
  TOKEN_TAGS,
  transformTokensResponse,
  validateAndTransformSingleTokenResponse,
} from "./internals";

const TOKEN_OUTPUT_FIELDS = Object.keys(ApiTokenResponseSchema.shape);

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

      /**
       * The CAL commit, which changes on any CAL deployment. It validates the token cache, since a
       * token's metadata (decimals, name, signature) can change without a token being added or
       * removed. Account sync uses {@link getTokenListHash} instead.
       */
      getTokensSyncHash: build.query<string, string>({
        async queryFn(currencyId, queryApi) {
          const extra = getCalExtra(queryApi);
          try {
            const url = new URL(`${extra.calServiceUrl}/v1/currencies`);
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

      /**
       * The CAL's hash of the token list of one network. It changes only when a token of that
       * network is added or removed, so an account resyncs its history only when its own network's
       * token list changed, not on every CAL deployment.
       */
      getTokenListHash: build.query<string, string>({
        async queryFn(currencyId, queryApi) {
          const extra = getCalExtra(queryApi);
          try {
            const url = new URL(`${extra.calServiceUrl}/v1/networks`);
            url.searchParams.set("output", "id,token_list_hash");
            url.searchParams.set("limit", "1");
            url.searchParams.set("id", currencyId);

            const response = await fetch(url, {
              headers: {
                "Content-Type": "application/json",
                [HEADER_X_LEDGER_CLIENT_VERSION]: extra.ledgerClientVersion,
              },
            });

            if (!response.ok) {
              return fetchNetworkError(response.status, response.statusText);
            }

            const parsed = ApiNetworkTokenListHashResponseSchema.safeParse(await response.json());
            if (!parsed.success) {
              return invalidNetworkResponseError();
            }

            const [network] = parsed.data;
            if (!network) {
              return networkNotFoundError(currencyId);
            }

            return { data: network.token_list_hash ?? EMPTY_TOKEN_LIST_HASH };
          } catch (error) {
            return fetchError(error);
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
  useGetTokenListHashQuery,
} = cryptoAssetsApi;

export type CryptoAssetsApi = typeof cryptoAssetsApi;
