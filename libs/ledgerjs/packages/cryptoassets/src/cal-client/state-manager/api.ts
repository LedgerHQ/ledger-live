import { createApi, fetchBaseQuery, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { ApiTokenResponse } from "../entities";
import { getEnv } from "@ledgerhq/live-env";
import { GetTokensDataParams, PageParam, TokensDataTags, TokensDataWithPagination } from "./types";
import { TOKEN_OUTPUT_FIELDS } from "./fields";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "../../currencies";

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
  const parentCurrency = findCryptoCurrencyById(token.network);
  if (!parentCurrency) {
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
    delisted: token.delisted,
    symbol: token.symbol,
  };
}

export const cryptoAssetsApi = createApi({
  reducerPath: "cryptoAssetsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "",
  }),
  tagTypes: [TokensDataTags.Tokens],
  endpoints: build => ({
    getTokensData: build.infiniteQuery<TokensDataWithPagination, GetTokensDataParams, PageParam>({
      query: ({ pageParam, queryArg = {} }) => {
        const { isStaging = false, output, networkFamily, pageSize = 100, limit, ref } = queryArg;

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

export const { useGetTokensDataInfiniteQuery } = cryptoAssetsApi;
