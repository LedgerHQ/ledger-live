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
import { CardApiExtraSchema } from "./schema";
import type {
  CardApiExtra,
  CardBaseQueryExtraOptions,
  CardSessionRefreshResult,
  CardSessionSnapshot,
} from "./types";

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

function cardHeaders(extra: CardApiExtra, token?: string | null, headers = new Headers()): Headers {
  headers.set("Content-Type", "application/json");
  headers.set(HEADER_X_CLIENT_KEY, extra.getCardBaanxClientKey());
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  return headers;
}

/**
 * `BaseQueryFn` promises a result, and RTK Query has no branch for a rejection: it logs the error,
 * throws it again, and stores a `SerializedError` that carries no `status`. Every caller that reads
 * `error.status` then reads `undefined`. The app owns both session ports, so this file cannot
 * promise they resolve. It gives a rejection the shape the signature declares.
 */
function sessionPortError(operation: "read" | "renew"): {
  error: FetchBaseQueryError;
} {
  return {
    error: {
      status: "CUSTOM_ERROR",
      error: `Card session ${operation} failed`,
    },
  };
}

const staleRequestResult: { error: FetchBaseQueryError } = {
  error: { status: "CUSTOM_ERROR", error: CARD_STALE_REQUEST },
};

function isUnauthorized(error: FetchBaseQueryError | undefined): boolean {
  return (
    error?.status === UNAUTHORIZED_STATUS ||
    (error?.status === "PARSING_ERROR" && error.originalStatus === UNAUTHORIZED_STATUS)
  );
}

const cardBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  CardBaseQueryExtraOptions
> = async (args, api, extraOptions) => {
  const extra = getCardExtra(api);

  const send = async (token: string | null) => {
    const answer = await fetchBaseQuery({
      baseUrl: extra.getCardApiBaseUrl(),
      prepareHeaders: headers => cardHeaders(extra, token, headers),
    })(args, api, extraOptions);

    return answer.error ? { error: answer.error } : { data: answer.data };
  };

  if (extraOptions?.authenticated === false) {
    return send(null);
  }

  let session: CardSessionSnapshot;
  try {
    session = await extra.readCardSession();
  } catch {
    return sessionPortError("read");
  }

  const sendForCurrentSession = async (token: string | null) => {
    if (!extra.isCardSessionCurrent(session.sessionId)) {
      return staleRequestResult;
    }

    const answer = await send(token);
    return extra.isCardSessionCurrent(session.sessionId) ? answer : staleRequestResult;
  };

  const result = await sendForCurrentSession(session.token);

  if (!session.token || !isUnauthorized(result.error)) {
    return result;
  }

  let renewal: CardSessionRefreshResult;
  try {
    renewal = await extra.refreshCardSession(session.sessionId, session.token);
  } catch {
    return sessionPortError("renew");
  }

  switch (renewal.kind) {
    case "refreshed":
      return sendForCurrentSession(renewal.accessToken);
    case "session-ended":
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
