import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { CARD_REDUCER_PATH, CARD_SESSION_ENDED, HEADER_X_CLIENT_KEY } from "./constants";
import { CardApiExtraSchema } from "./schema";
import { toSchemaFailureError } from "./schemaFailure";
import type { CardApiExtra, CardBaseQueryExtraOptions, CardSessionRefreshResult } from "./types";

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

/**
 * The answer to a request whose session the owner has just ended.
 *
 * 401, because the failure that led here may have been anything, and because the login flow reads
 * `status === 401` to decide that a session is finished. The body carries no token.
 */
const sessionEndedResult: { error: FetchBaseQueryError } = {
  error: { status: UNAUTHORIZED_STATUS, data: { message: CARD_SESSION_ENDED } },
};

const cardBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  CardBaseQueryExtraOptions
> = async (args, api, extraOptions) => {
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

  // The two OAuth2 grants authenticate themselves. They opt out of both services below, which is
  // also what stops a dead refresh token from looping through its own renewal.
  if (extraOptions?.authenticated === false) {
    return runWithToken(null);
  }

  let token: string | null | undefined;
  try {
    token = await extra.getCardSessionToken();
  } catch (error) {
    // A request without the token answers 401. The renewal below cannot help, and that answer would
    // hide the read failure. Report the failure instead.
    return sessionError(error);
  }

  const result = await runWithToken(token);

  if (result.error?.status !== UNAUTHORIZED_STATUS) {
    return result;
  }

  let refresh: CardSessionRefreshResult;
  try {
    refresh = await extra.refreshCardSession();
  } catch {
    // The 401 tells the caller more than a failed renewal does.
    return result;
  }

  switch (refresh.kind) {
    case "refreshed":
      // At most one replay. A second 401 is the caller's answer.
      return runWithToken(refresh.accessToken);
    case "session-ended":
      return sessionEndedResult;
    case "unavailable":
      return result;
  }
};

/** Endpoint-less Card api — use cases inject here. See shared/api-services README. */
export const cardApi = createApi({
  reducerPath: CARD_REDUCER_PATH,
  baseQuery: cardBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
  /**
   * Without this, RTK throws the `NamedSchemaError` again, and its `value` — for either OAuth2
   * grant, the whole token response — lands in the rejected action. Keep the issues, drop the value.
   */
  catchSchemaFailure: error => toSchemaFailureError(error.schemaName, error.issues),
});

export type CardApi = typeof cardApi;
