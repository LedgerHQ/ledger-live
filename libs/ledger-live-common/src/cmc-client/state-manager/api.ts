import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getEnv } from "@ledgerhq/live-env";
import { FearAndGreedTags, FearAndGreedIndex, FearAndGreedResponseSchema } from "./types";
import { log } from "@ledgerhq/logs";

const ONE_MINUTE_IN_MS = 60 * 1000;
export const FIFTEEN_MINUTES_IN_MS = 15 * ONE_MINUTE_IN_MS;

const ONE_MINUTE_IN_SECONDS = 60;
const FIFTEEN_MINUTES_IN_SECONDS = 15 * ONE_MINUTE_IN_SECONDS;

function transformFearAndGreedResponse(response: unknown): FearAndGreedIndex {
  const result = FearAndGreedResponseSchema.safeParse(response);

  if (!result.success) {
    log("cmc-client", "Invalid response schema:", {
      errors: result.error.errors,
      received: response,
    });
    throw new Error(
      `[CMC API] Schema validation failed: ${result.error.errors
        .map(e => `${e.path.join(".")}: ${e.message}`)
        .join(", ")}`,
    );
  }

  return {
    value: result.data.data.value,
    classification: result.data.data.value_classification,
  };
}

export const cmcApi = createApi({
  reducerPath: "cmcApi",
  baseQuery: fetchBaseQuery({
    baseUrl: getEnv("CMC_API_URL"),
  }),
  tagTypes: [FearAndGreedTags.Latest],
  endpoints: build => ({
    getFearAndGreedLatest: build.query<FearAndGreedIndex, void>({
      query: () => ({
        url: "/fear-and-greed/latest",
      }),
      providesTags: [FearAndGreedTags.Latest],
      transformResponse: transformFearAndGreedResponse,
      keepUnusedDataFor: FIFTEEN_MINUTES_IN_SECONDS,
    }),
  }),
});

export const { useGetFearAndGreedLatestQuery } = cmcApi;
