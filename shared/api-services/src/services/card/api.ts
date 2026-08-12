import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { CARD_REDUCER_PATH, HEADER_X_CLIENT_KEY } from "./constants";
import { CardApiExtraSchema } from "./schema";
import type { CardApiExtra } from "./types";

/** Validates and returns this service's `extraArgument` slice. */
export function cardApiExtra(extra: CardApiExtra): CardApiExtra {
  return CardApiExtraSchema.parse(extra);
}

export function getCardExtra(api: { extra: unknown }): CardApiExtra {
  return api.extra as CardApiExtra;
}

const UNAUTHORIZED_STATUS = 401;

const cardBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const extra = getCardExtra(api);

  const runWithToken = (token: string | null | undefined) =>
    fetchBaseQuery({
      baseUrl: extra.cardApiBaseUrl,
      prepareHeaders: headers => {
        headers.set("Content-Type", "application/json");
        headers.set(HEADER_X_CLIENT_KEY, extra.cardBaanxClientKey);
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
        return headers;
      },
    })(args, api, extraOptions);

  const result = await runWithToken(extra.getCardSessionToken());

  const isUnauthorized =
    !!result.error &&
    typeof result.error.status === "number" &&
    result.error.status === UNAUTHORIZED_STATUS;

  if (!isUnauthorized) {
    return result;
  }

  const refreshedToken = await extra.refreshCardSession();
  if (!refreshedToken) {
    return result;
  }

  return runWithToken(refreshedToken);
};

/** Endpoint-less Card api — use cases inject here. See shared/api-services README. */
export const cardApi = createApi({
  reducerPath: CARD_REDUCER_PATH,
  baseQuery: cardBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
});

export type CardApi = typeof cardApi;
