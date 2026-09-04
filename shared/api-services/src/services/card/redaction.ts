import type { Action } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { CARD_GRANT_ENDPOINTS, CARD_REDUCER_PATH, REDACTED } from "./constants";

const FETCH_BASE_QUERY_ERROR_STRING_STATUSES = new Set<FetchBaseQueryError["status"]>([
  "FETCH_ERROR",
  "PARSING_ERROR",
  "TIMEOUT_ERROR",
  "CUSTOM_ERROR",
]);

function isFetchBaseQueryErrorStatus(status: unknown): status is FetchBaseQueryError["status"] {
  return (
    typeof status === "number" ||
    FETCH_BASE_QUERY_ERROR_STRING_STATUSES.has(status as FetchBaseQueryError["status"])
  );
}

export function isCardApiAction(action: Action): boolean {
  return action.type.startsWith(`${CARD_REDUCER_PATH}/`);
}

export function redactCardApiAction<A extends Action>(action: A): A {
  if (!isCardApiAction(action)) {
    return action;
  }

  const redacted: Record<string, unknown> = { ...action };

  if ("payload" in redacted && redacted.payload !== undefined) {
    redacted.payload = redactedPayload(redacted.payload);
  }

  if ("error" in redacted && redacted.error !== undefined) {
    redacted.error = REDACTED;
  }

  if (isRecord(redacted.meta)) {
    const meta: Record<string, unknown> = { ...redacted.meta };
    if (isRecord(meta.arg)) {
      meta.arg = { ...meta.arg, originalArgs: REDACTED };
    }
    if (isRecord(meta.baseQueryMeta)) {
      meta.baseQueryMeta = withoutRequestAndResponse(meta.baseQueryMeta);
    }
    redacted.meta = meta;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return redacted as A;
}

export function redactCardApiState<S>(state: S): S {
  if (!isRecord(state) || !isRecord(state[CARD_REDUCER_PATH])) {
    return state;
  }

  const cardState = state[CARD_REDUCER_PATH];
  const redactedCardState: Record<string, unknown> = { ...cardState };
  let redactedAnything = false;

  for (const substate of ["queries", "mutations"]) {
    const entries = cardState[substate];
    if (!isRecord(entries)) {
      continue;
    }

    const redactedEntries: Record<string, unknown> = { ...entries };
    for (const [key, entry] of Object.entries(entries)) {
      if (!isRecord(entry) || !CARD_GRANT_ENDPOINTS.has(String(entry.endpointName))) {
        continue;
      }

      redactedEntries[key] = {
        ...entry,
        ...("data" in entry ? { data: REDACTED } : {}),
        ...("originalArgs" in entry ? { originalArgs: REDACTED } : {}),
      };
      redactedAnything = true;
    }

    redactedCardState[substate] = redactedEntries;
  }

  if (!redactedAnything) {
    return state;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { ...state, [CARD_REDUCER_PATH]: redactedCardState } as S;
}

/** A `CUSTOM_ERROR` carries our own error string instead of a provider `data` payload. */
function redactedPayload(payload: unknown): unknown {
  if (!isRecord(payload) || !isFetchBaseQueryErrorStatus(payload.status)) {
    return REDACTED;
  }

  const keptError =
    payload.status === "CUSTOM_ERROR" && typeof payload.error === "string"
      ? { error: payload.error }
      : {};

  const keptOriginalStatus =
    typeof payload.originalStatus === "number" ? { originalStatus: payload.originalStatus } : {};

  return { status: payload.status, ...keptError, ...keptOriginalStatus, data: REDACTED };
}

function withoutRequestAndResponse(meta: Record<string, unknown>): Record<string, unknown> {
  const kept: Record<string, unknown> = { ...meta };
  if ("request" in kept) {
    kept.request = REDACTED;
  }
  if ("response" in kept) {
    kept.response = REDACTED;
  }
  return kept;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
