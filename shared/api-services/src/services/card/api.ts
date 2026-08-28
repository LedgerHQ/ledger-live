import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import {
  CARD_REDUCER_PATH,
  CARD_STALE_REQUEST,
  HEADER_X_CLIENT_KEY,
  UNAUTHORIZED_STATUS,
} from "./constants";
import { CardRequestError } from "./errors";
import { CardApiExtraSchema } from "./schema";
import type { CardApiExtra, CardSessionRefreshResult, CardSessionSnapshot } from "./types";

/**
 * A schema failure, with the value that failed dropped.
 *
 * RTK rethrows its own `NamedSchemaError`, whose `value` is the whole response body. That lands in
 * the rejected action, which the desktop log export writes to the file users attach to a support
 * ticket.
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

/** The two headers every Card request carries, plus the Bearer when the caller holds one. */
function cardHeaders(extra: CardApiExtra, token?: string | null, headers = new Headers()): Headers {
  headers.set("Content-Type", "application/json");
  headers.set(HEADER_X_CLIENT_KEY, extra.getCardBaanxClientKey());
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  return headers;
}

/**
 * One JSON POST against the Card API, outside RTK Query.
 *
 * The two OAuth2 grants send their requests here rather than through an endpoint. Their argument and
 * their answer are both credentials, and RTK Query dispatches an action for every phase of a
 * request: the argument rides on the pending one and the answer on the fulfilled one. The desktop
 * redux logger writes both into the file users attach to a support ticket, in production, and the
 * mobile DevTools relay sends both over a socket and takes no sanitizer.
 *
 * It sends no Bearer and it never renews. A grant carries its own proof, and a renewal that went
 * through the authenticated path would answer 401, renew again, and loop.
 *
 * It throws a {@link CardRequestError} that names the path and the status, and never the body.
 */
export async function postCardJson(
  extra: CardApiExtra,
  path: string,
  body: unknown,
): Promise<unknown> {
  const response = await fetch(`${extra.getCardApiBaseUrl().replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: cardHeaders(extra),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new CardRequestError(path, `the provider answered ${response.status}`);
  }

  try {
    return await response.json();
  } catch {
    // The parse message quotes what it could not read, and that body is a token response.
    throw new CardRequestError(path, "the provider answered a body that is not JSON");
  }
}

/**
 * `BaseQueryFn` promises a result, and RTK Query has no branch for a rejection: it logs the error,
 * throws it again, and stores a `SerializedError` that carries no `status`. Every caller that reads
 * `error.status` then reads `undefined`. The app owns both session ports, so this file cannot
 * promise they resolve. It gives a rejection the shape the signature declares.
 */
function sessionPortError(error: unknown): { error: FetchBaseQueryError } {
  return {
    error: {
      status: "CUSTOM_ERROR",
      error: error instanceof Error ? error.message : String(error),
    },
  };
}

/**
 * The answer to a request whose session a logout or a newer login replaced while it was in flight.
 *
 * Not a 401: the login flow ends a session on a 401, and this request says nothing about the session
 * now on disk, which belongs to somebody else.
 */
const staleRequestResult: { error: FetchBaseQueryError } = {
  error: { status: "CUSTOM_ERROR", error: CARD_STALE_REQUEST },
};

const cardBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const extra = getCardExtra(api);

  const send = async (token: string | null) => {
    const answer = await fetchBaseQuery({
      baseUrl: extra.getCardApiBaseUrl(),
      prepareHeaders: headers => cardHeaders(extra, token, headers),
    })(args, api, extraOptions);

    // `fetchBaseQuery` reports the whole `Request` as its `meta`, and those headers carry the
    // Bearer. RTK copies that object into `meta.baseQueryMeta` of every pending, fulfilled and
    // rejected action. Nothing in the app reads it, so the Card base query hands out none.
    return answer.error ? { error: answer.error } : { data: answer.data };
  };

  let session: CardSessionSnapshot;
  try {
    session = await extra.readCardSession();
  } catch (error) {
    // A keychain the OS refused must never pass for an absent session, because an absent session
    // ends one. Report the read failure rather than a 401 the renewal could not help with.
    return sessionPortError(error);
  }

  const result = await send(session.token);

  // A request that carried no Bearer has no session to renew, and any other status is the caller's
  // answer.
  if (!session.token || result.error?.status !== UNAUTHORIZED_STATUS) {
    return result;
  }

  let renewal: CardSessionRefreshResult;
  try {
    renewal = await extra.refreshCardSession(session.sessionId);
  } catch (error) {
    return sessionPortError(error);
  }

  switch (renewal.kind) {
    case "refreshed":
      // At most one replay, and only with a token from the same session. A second 401 is the
      // caller's answer.
      return send(renewal.accessToken);
    case "session-ended":
      // Terminal cleanup has already run. The 401 the provider sent is the answer, and the login
      // flow reads it as the end of the session.
      return result;
    case "session-replaced":
      return staleRequestResult;
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
