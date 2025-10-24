import { createApi, fetchBaseQuery, FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { ApiTokenResponse } from "../entities";
import { getEnv } from "@ledgerhq/live-env";
import { GetTokensDataParams, PageParam, TokensDataTags, TokensDataWithPagination } from "./types";
import { TOKEN_OUTPUT_FIELDS } from "./fields";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { convertApiToken } from "../../api-token-converter";

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

  // Add symbol if result exists
  if (result && token.symbol) {
    return {
      ...result,
      symbol: token.symbol,
    };
  }

  return result;
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
