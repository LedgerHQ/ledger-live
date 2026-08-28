import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query/react";
import {
  CARD_REDUCER_PATH,
  CARD_RENEWAL_UNAVAILABLE,
  CARD_SESSION_ENDED,
  HEADER_X_CLIENT_KEY,
  UNAUTHORIZED_STATUS,
} from "./constants";
import { CardApiExtraSchema } from "./schema";
import type {
  CardApiExtra,
  CardBaseQueryExtraOptions,
  CardBaseQueryMeta,
  CardSessionRefreshResult,
} from "./types";

/**
 * A schema failure, with the value that failed dropped.
 *
 * RTK rethrows its own `NamedSchemaError`, whose `value` is the whole token response for either
 * OAuth2 grant. That lands in the rejected action, which the desktop log export writes to disk.
 */
export function toSchemaFailureError(schemaName: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error: `${schemaName} validation failed` };
}

/** Validates and returns this service's `extraArgument` slice. */
export function cardApiExtra(extra: CardApiExtra): CardApiExtra {
  return CardApiExtraSchema.parse(extra);
}

export function getCardExtra(api: { extra: unknown }): CardApiExtra {
  return api.extra as CardApiExtra;
}

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

/**
 * The answer to a 401 that said nothing about the session: no renewal ran, or the request outlived
 * the session it was sent with.
 *
 * A renewal that ran and failed never lands here. It ends the session, and the owner has already
 * cleaned it up by the time this file sees the answer.
 *
 * The status stays 401, because that is what the provider answered. The body names the reason, and
 * the login flow reads that name to keep the session instead of signing the user out.
 */
function renewalUnavailableResult(reason: string) {
  return {
    error: {
      status: UNAUTHORIZED_STATUS,
      data: { message: CARD_RENEWAL_UNAVAILABLE, reason },
    } satisfies FetchBaseQueryError,
  };
}

/**
 * Replaces `fetchBaseQuery`'s `meta` with three plain values.
 *
 * `FetchBaseQueryMeta.request` is the whole `Request`, and its headers carry the Bearer. RTK copies
 * that object into `meta.baseQueryMeta` of every pending, fulfilled and rejected action, which is
 * what the desktop log export and the mobile DevTools relay both serialize. Nothing in the app reads
 * the `Request`, so the Card base query never hands one out.
 */
function safeMeta(meta: FetchBaseQueryMeta | undefined): CardBaseQueryMeta | undefined {
  if (!meta) {
    return undefined;
  }

  return {
    requestUrl: meta.request?.url,
    requestMethod: meta.request?.method,
    responseStatus: meta.response?.status,
  };
}

const cardBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  CardBaseQueryExtraOptions,
  CardBaseQueryMeta
> = async (args, api, extraOptions) => {
  const extra = getCardExtra(api);

  const runWithToken = async (token: string | null | undefined) => {
    const result = await fetchBaseQuery({
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

    return { ...result, meta: safeMeta(result.meta) };
  };

  // The two OAuth2 grants authenticate themselves. They opt out of both services below, which is
  // also what stops a dead refresh token from looping through its own renewal.
  if (extraOptions?.authenticated === false) {
    return runWithToken(null);
  }

  let token: string | null | undefined;
  let sessionId: number;
  try {
    ({ token, sessionId } = await extra.readCardSession());
  } catch (error) {
    // A request without the token answers 401. The renewal below cannot help, and that answer would
    // hide the read failure. Report the failure instead. A keychain the OS refused to read must
    // never pass for an absent session, because an absent session ends one.
    return sessionError(error);
  }

  const result = await runWithToken(token);

  if (result.error?.status !== UNAUTHORIZED_STATUS) {
    return result;
  }

  let refresh: CardSessionRefreshResult;
  try {
    // The id names the session this request used. A logout or a new login that landed while the
    // request was in flight makes it stale, and the owner then renews nothing and clears nothing.
    refresh = await extra.refreshCardSession(sessionId);
  } catch {
    return renewalUnavailableResult("renewal_threw");
  }

  switch (refresh.kind) {
    case "refreshed":
      // At most one replay, and only with a token from the same session. A second 401 is the
      // caller's answer.
      return runWithToken(refresh.accessToken);
    case "session-ended":
      return sessionEndedResult;
    case "unavailable":
      return renewalUnavailableResult(refresh.reason);
  }
};

/** Endpoint-less Card api — use cases inject here. See shared/api-services README. */
export const cardApi = createApi({
  reducerPath: CARD_REDUCER_PATH,
  baseQuery: cardBaseQuery,
  tagTypes: [],
  endpoints: () => ({}),
  catchSchemaFailure: error => toSchemaFailureError(error.schemaName),
});

export type CardApi = typeof cardApi;
