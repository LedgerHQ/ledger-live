import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@ledgerhq/live-env";

import {
  Tags,
  counterValueIdsSortedByMarketCapSchema,
  type CounterValueIdsSortedByMarketCap,
} from "./schema";
import { onSchemaFailure } from "./onSchemaFailure";

const THIRTY_MINUTES = 30 * 60;
const apiName = "counterValuesApi";

export const counterValuesApi = createApi({
  reducerPath: apiName,
  baseQuery: fetchBaseQuery({ baseUrl: getEnv("LEDGER_COUNTERVALUES_API") }),
  tagTypes: [Tags.CounterValueIdsSortedByMarketCap],
  onSchemaFailure: (error, { endpoint }) => onSchemaFailure({ apiName, endpoint, error }),
  endpoints: build => ({
    getCounterValueIdsSortedByMarketCap: build.query<CounterValueIdsSortedByMarketCap, void>({
      query: () => "/v3/supported/crypto",
      providesTags: [Tags.CounterValueIdsSortedByMarketCap],
      keepUnusedDataFor: THIRTY_MINUTES,
      responseSchema: counterValueIdsSortedByMarketCapSchema,
    }),
  }),
});

export const { useGetCounterValueIdsSortedByMarketCapQuery } = counterValuesApi;
