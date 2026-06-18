import { createApi } from "@reduxjs/toolkit/query/react";
import { createAuthenticatedBaseQuery } from "@ledgerhq/rtk-query-auth";

import { getSwapAPIBaseURL } from "../../../../exchange/swap";
import type { RawQuoteAPIResponse } from "../service/types";

export type FetchSwapQuotesRequest = {
  params: URLSearchParams;
  headers: Record<string, string>;
};

export const swapQuotesApi = createApi({
  reducerPath: "swapQuotesApi",
  baseQuery: createAuthenticatedBaseQuery({
    baseUrl: getSwapAPIBaseURL(),
  }),
  endpoints: build => ({
    getSwapQuotes: build.query<RawQuoteAPIResponse, FetchSwapQuotesRequest>({
      query: request => ({
        url: `quote?${request.params.toString()}`,
        method: "GET",
        headers: request.headers,
      }),
      keepUnusedDataFor: 0,
    }),
  }),
});

export type FetchSwapQuotesQueryResult = {
  abort(): void;
  unsubscribe(): void;
  unwrap(): Promise<RawQuoteAPIResponse | undefined>;
};

export type FetchQuotesDispatch = (
  action: ReturnType<typeof swapQuotesApi.endpoints.getSwapQuotes.initiate>,
) => FetchSwapQuotesQueryResult;
