import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@ledgerhq/live-env";

import {
  Tags,
  counterValueIdsSortedByMarketCapSchema,
  type CounterValueIdsSortedByMarketCap,
  spotSimpleResponseSchema,
  type SpotSimpleResponse,
} from "./schema";
import { onSchemaFailure } from "./onSchemaFailure";
import { extractUsdToFiatRate } from "../utils/extractUsdToFiatRate";

const THIRTY_MINUTES = 30 * 60;
const ONE_MINUTE = 60;
const apiName = "counterValuesApi";

export const counterValuesApi = createApi({
  reducerPath: apiName,
  baseQuery: fetchBaseQuery({ baseUrl: getEnv("LEDGER_COUNTERVALUES_API") }),
  tagTypes: [Tags.CounterValueIdsSortedByMarketCap, Tags.UsdToFiatRate],
  onSchemaFailure: (error, { endpoint }) => onSchemaFailure({ apiName, endpoint, error }),
  endpoints: build => ({
    getCounterValueIdsSortedByMarketCap: build.query<CounterValueIdsSortedByMarketCap, void>({
      query: () => "/v3/supported/crypto",
      providesTags: [Tags.CounterValueIdsSortedByMarketCap],
      keepUnusedDataFor: THIRTY_MINUTES,
      responseSchema: counterValueIdsSortedByMarketCapSchema,
    }),
    getUsdToFiatRate: build.query<number | null, { to: string }>({
      query: ({ to }) => ({
        url: "/v3/spot/simple",
        params: { froms: "usd", to: to.toLowerCase() },
      }),
      serializeQueryArgs: ({ queryArgs }) => ({ to: queryArgs.to.toLowerCase() }),
      providesTags: [Tags.UsdToFiatRate],
      rawResponseSchema: spotSimpleResponseSchema,
      transformResponse: (res: SpotSimpleResponse) => extractUsdToFiatRate(res),
      keepUnusedDataFor: ONE_MINUTE,
    }),
  }),
});

export const { useGetCounterValueIdsSortedByMarketCapQuery, useGetUsdToFiatRateQuery } =
  counterValuesApi;
