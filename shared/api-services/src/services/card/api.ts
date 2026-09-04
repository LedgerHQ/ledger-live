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

/**
 * `BaseQueryFn` promises a result, and RTK Query has no branch for a rejection: it logs the error,
 * throws it again, and stores a `SerializedError` that carries no `status`. Every caller that reads
 * `error.status` then reads `undefined`. The app owns both session ports, so this file cannot
 * promise they resolve. It gives a rejection the shape the signature declares.
 */
function sessionError(error: unknown): { error: FetchBaseQueryError } {
  return {
    error: {
      status: "CUSTOM_ERROR",
      error: error instanceof Error ? error.message : String(error),
    },
  };
}

const cardBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const extra = getCardExtra(api);

  const runWithToken = (token: string | null | undefined) =>
    fetchBaseQuery({
      baseUrl: extra.getCardApiBaseUrl(),
      prepareHeaders: headers => {
        headers.set("Content-Type", "application/json");
        headers.set(HEADER_X_CLIENT_KEY, extra.getCardBaanxClientKey());
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
        return headers;
      },
    })(args, api, extraOptions);

  let token: string | null | undefined;
  try {
    token = await extra.getCardSessionToken();
  } catch (error) {
    // A request without the token answers 401. The refresh below cannot help, and that answer would
    // hide the read failure. Report the failure instead.
    return sessionError(error);
  }

  const result = await runWithToken(token);

  const isUnauthorized =
    !!result.error &&
    typeof result.error.status === "number" &&
    result.error.status === UNAUTHORIZED_STATUS;

  if (!isUnauthorized) {
    return result;
  }

  let refreshedToken: string | null | undefined;
  try {
    refreshedToken = await extra.refreshCardSession();
  } catch {
    // The 401 tells the caller more than a failed refresh does.
    return result;
  }

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
