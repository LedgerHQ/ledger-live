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
import { toSchemaFailureError } from "./schemaFailure";
import type {
  CardApiExtra,
  CardBaseQueryExtraOptions,
  CardBaseQueryMeta,
  CardSessionRefreshResult,
  CardSessionRenewalError,
} from "./types";

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
 * The answer to a 401 the owner could not judge: the renewal failed for a nonterminal reason, or
 * the request outlived its session.
 *
 * The status stays 401, because that is what the provider answered. The body names the reason, and
 * the login flow reads that name to keep the session instead of signing the user out. A 5xx or a
 * transport failure on the token endpoint therefore no longer ends a login.
 */
function renewalUnavailableResult(reason: string, error?: CardSessionRenewalError) {
  return {
    error: {
      status: UNAUTHORIZED_STATUS,
      data: {
        message: CARD_RENEWAL_UNAVAILABLE,
        reason,
        cause: error?.message,
        status: error?.status,
      },
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
  let epoch: number;
  try {
    ({ token, epoch } = await extra.readCardSession());
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
    // The epoch names the session this request used. A logout or a new login that landed while the
    // request was in flight makes it stale, and the owner then renews nothing and clears nothing.
    refresh = await extra.refreshCardSession(epoch);
  } catch (error) {
    return renewalUnavailableResult("renewal_threw", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  switch (refresh.kind) {
    case "refreshed":
      // At most one replay, and only with a token from the same session. A second 401 is the
      // caller's answer.
      return runWithToken(refresh.accessToken);
    case "session-ended":
      return sessionEndedResult;
    case "session-replaced":
      return renewalUnavailableResult("session_replaced");
    case "unavailable":
      return renewalUnavailableResult("renewal_failed", refresh.error);
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
