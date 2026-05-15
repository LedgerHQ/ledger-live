import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@ledgerhq/live-env";
import {
  FearAndGreedTags,
  FearAndGreedIndex,
  AltcoinSeasonIndexTags,
  AltcoinSeasonIndex,
} from "./types";
import { transformFearAndGreedResponse, transformAltcoinSeasonIndexResponse } from "./transforms";

const ONE_MINUTE_IN_MS = 60 * 1000;
export const FIFTEEN_MINUTES_IN_MS = 15 * ONE_MINUTE_IN_MS;

const ONE_MINUTE_IN_SECONDS = 60;
const FIFTEEN_MINUTES_IN_SECONDS = 15 * ONE_MINUTE_IN_SECONDS;

export const cmcApi = createApi({
  reducerPath: "cmcApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getEnv("CMC_API_URL"),
  }),
  tagTypes: [FearAndGreedTags.Latest, AltcoinSeasonIndexTags.Latest],
  endpoints: build => ({
    getFearAndGreedLatest: build.query<FearAndGreedIndex, void>({
      query: () => ({
        url: "/fear-and-greed/latest",
      }),
      providesTags: [FearAndGreedTags.Latest],
      transformResponse: transformFearAndGreedResponse,
      keepUnusedDataFor: FIFTEEN_MINUTES_IN_SECONDS,
    }),
    getAltcoinSeasonIndexLatest: build.query<AltcoinSeasonIndex, void>({
      query: () => ({
        url: "/altcoin-season-index/latest",
      }),
      providesTags: [AltcoinSeasonIndexTags.Latest],
      transformResponse: transformAltcoinSeasonIndexResponse,
      keepUnusedDataFor: FIFTEEN_MINUTES_IN_SECONDS,
    }),
  }),
});

export const { useGetFearAndGreedLatestQuery, useGetAltcoinSeasonIndexLatestQuery } = cmcApi;
