import {
  createApi,
  fetchBaseQuery,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from "@reduxjs/toolkit/query/react";
import { convertApiAssets } from "@ledgerhq/cryptoassets";
import { RawApiResponse, AssetsData } from "../entities";
import { getEnv } from "@ledgerhq/live-env";
import {
  AssetsAdditionalData,
  AssetsDataTags,
  AssetsDataWithPagination,
  GetAssetsDataParams,
  GetAssetsByCategoryParams,
  ONE_DAY_IN_SECONDS,
  PageParam,
} from "./types";
import { chunkCurrencyIds } from "../utils/chunkCurrencyIds";
import { deepMergeCryptoAssets } from "../utils/deepMergeCryptoAssets";

const ALLOWED_DADA_HOSTS = new Set(["dada.api.ledger.com", "dada.api.ledger-test.com"]);

type SettledResult<T> = { status: "fulfilled"; value: T } | { status: "rejected"; reason: unknown };

function allSettled<T>(promises: Promise<T>[]): Promise<SettledResult<T>[]> {
  return Promise.all(
    promises.map(p =>
      p
        .then(value => ({ status: "fulfilled" as const, value }))
        .catch(reason => ({ status: "rejected" as const, reason })),
    ),
  );
}

function assertDadaApiUrl(url: URL): void {
  if (!ALLOWED_DADA_HOSTS.has(url.hostname)) {
    throw new Error(`Blocked request to untrusted host: ${url.hostname}`);
  }
}

function transformAssetsResponse(
  response: RawApiResponse,
  meta?: FetchBaseQueryMeta,
): AssetsDataWithPagination {
  const enrichedCryptoOrTokenCurrencies = convertApiAssets(response.cryptoOrTokenCurrencies);

  const nextCursor = meta?.response?.headers.get("x-ledger-next") || undefined;

  return {
    ...response,
    cryptoOrTokenCurrencies: enrichedCryptoOrTokenCurrencies,
    pagination: {
      nextCursor,
    },
  };
}

function emptyAssetsData(): AssetsData {
  return {
    cryptoAssets: {},
    networks: {},
    cryptoOrTokenCurrencies: {},
    interestRates: {},
    markets: {},
    currenciesOrder: { metaCurrencyIds: [], key: "", order: "" },
  };
}

export function buildAssetsQueryParams(
  queryArg: GetAssetsDataParams,
  opts?: { pageSize?: number; cursor?: string },
): Record<string, unknown> {
  return {
    pageSize: opts?.pageSize ?? 100,
    ...(opts?.cursor && { cursor: opts.cursor }),
    ...(queryArg.useCase && { transaction: queryArg.useCase }),
    ...(queryArg.currencyIds &&
      queryArg.currencyIds.length > 0 && {
        currencyIds: queryArg.currencyIds,
      }),
    ...(queryArg.search && { search: queryArg.search }),
    product: queryArg.product,
    minVersion: queryArg.version,
    ...(queryArg.includeTestNetworks && { includeTestNetworks: queryArg.includeTestNetworks }),
    additionalData: queryArg.additionalData || [
      AssetsAdditionalData.Apy,
      AssetsAdditionalData.MarketTrend,
    ],
  };
}

function resolveBaseUrl(queryArg: { isStaging?: boolean }): string {
  return queryArg.isStaging ? getEnv("DADA_API_STAGING") : getEnv("DADA_API_PROD");
}

async function fetchAssetsPage(
  baseUrl: string,
  queryArg: GetAssetsDataParams,
): Promise<AssetsData> {
  const params = buildAssetsQueryParams(queryArg);
  const url = new URL(`${baseUrl}/assets`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
  }

  assertDadaApiUrl(url);
  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`DADA fetch failed: ${response.status} ${response.statusText}`);
  }

  const raw: RawApiResponse = await response.json();
  const enrichedCryptoOrTokenCurrencies = convertApiAssets(raw.cryptoOrTokenCurrencies);

  return {
    ...raw,
    cryptoOrTokenCurrencies: enrichedCryptoOrTokenCurrencies,
  };
}

export async function fetchAllAssetsByCategory(
  queryArg: GetAssetsByCategoryParams,
): Promise<QueryReturnValue<string[], FetchBaseQueryError, FetchBaseQueryMeta | undefined>> {
  try {
    const baseUrl = queryArg.isStaging ? getEnv("DADA_API_STAGING") : getEnv("DADA_API_PROD");
    const allTickers: string[] = [];
    let cursor: string | undefined;

    do {
      const url = new URL(`${baseUrl}/assets`);
      url.searchParams.set("categories", queryArg.category);
      url.searchParams.set("product", queryArg.product);
      url.searchParams.set("pageSize", "100");
      url.searchParams.set("minVersion", queryArg.version);
      if (cursor) {
        url.searchParams.set("cursor", cursor);
      }

      assertDadaApiUrl(url);
      const response = await fetch(url.toString());

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data: `Failed to fetch assets by category: ${response.statusText}`,
          },
        };
      }

      const data: RawApiResponse = await response.json();
      allTickers.push(...Object.values(data.cryptoAssets).map(a => a.ticker));
      cursor = response.headers.get("x-ledger-next") || undefined;
    } while (cursor);

    return { data: allTickers };
  } catch (error) {
    return {
      error: {
        status: "FETCH_ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

export const assetsDataApi = createApi({
  reducerPath: "assetsDataApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "", // Will be overridden in query
  }),
  tagTypes: [AssetsDataTags.Assets],
  endpoints: build => ({
    getAssetsData: build.infiniteQuery<AssetsDataWithPagination, GetAssetsDataParams, PageParam>({
      query: ({ pageParam, queryArg }) => ({
        url: `${resolveBaseUrl(queryArg)}/assets`,
        params: buildAssetsQueryParams(queryArg, { cursor: pageParam?.cursor }),
      }),
      providesTags: [AssetsDataTags.Assets],
      transformResponse: transformAssetsResponse,
      infiniteQueryOptions: {
        initialPageParam: {
          cursor: "",
        },
        getNextPageParam: lastPage => {
          if (lastPage.pagination.nextCursor) {
            return {
              cursor: lastPage.pagination.nextCursor,
            };
          } else {
            return undefined;
          }
        },
      },
    }),
    getAssetData: build.query<AssetsDataWithPagination, GetAssetsDataParams>({
      query: queryArg => ({
        url: `${resolveBaseUrl(queryArg)}/assets`,
        params: buildAssetsQueryParams(queryArg, { pageSize: 1 }),
      }),
      providesTags: [AssetsDataTags.Assets],
      transformResponse: transformAssetsResponse,
    }),
    getAssetsByCategory: build.query<string[], GetAssetsByCategoryParams>({
      queryFn: async queryArg => {
        return fetchAllAssetsByCategory(queryArg);
      },
      keepUnusedDataFor: ONE_DAY_IN_SECONDS,
    }),
    getChunkedAssetsData: build.query<AssetsData, GetAssetsDataParams>({
      queryFn: async queryArg => {
        try {
          const chunks = chunkCurrencyIds(queryArg.currencyIds ?? []);
          const baseUrl = resolveBaseUrl(queryArg);

          if (chunks.length === 0) {
            return { data: emptyAssetsData() };
          }

          const results = await allSettled(
            chunks.map(chunkIds =>
              fetchAssetsPage(baseUrl, { ...queryArg, currencyIds: chunkIds }),
            ),
          );

          const responses = results.flatMap(r => (r.status === "fulfilled" ? [r.value] : []));

          if (responses.length === 0) {
            const firstError = results.find(r => r.status === "rejected");
            const reason = firstError?.status === "rejected" ? firstError.reason : undefined;
            return {
              error: {
                status: "FETCH_ERROR",
                error: reason instanceof Error ? reason.message : "All DADA chunks failed",
              },
            };
          }

          const merged = responses.reduce<AssetsData>((acc, res) => {
            deepMergeCryptoAssets(acc.cryptoAssets, res.cryptoAssets);
            Object.assign(acc.networks, res.networks);
            Object.assign(acc.cryptoOrTokenCurrencies, res.cryptoOrTokenCurrencies);
            Object.assign(acc.interestRates, res.interestRates);
            Object.assign(acc.markets, res.markets);
            acc.currenciesOrder.metaCurrencyIds.push(...res.currenciesOrder.metaCurrencyIds);
            return acc;
          }, emptyAssetsData());

          return { data: merged };
        } catch (error) {
          return {
            error: {
              status: "FETCH_ERROR",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          };
        }
      },
      providesTags: [AssetsDataTags.Assets],
      keepUnusedDataFor: ONE_DAY_IN_SECONDS,
    }),
  }),
});

export const {
  useGetAssetsDataInfiniteQuery,
  useGetAssetDataQuery,
  useGetAssetsByCategoryQuery,
  useGetChunkedAssetsDataQuery,
} = assetsDataApi;
