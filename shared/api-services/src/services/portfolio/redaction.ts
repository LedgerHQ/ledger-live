import type { Action } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { PORTFOLIO_REDUCER_PATH } from "./constants";

const REDACTED = "[REDACTED]";

const FETCH_ERROR_STATUSES = new Set<FetchBaseQueryError["status"]>([
  "FETCH_ERROR",
  "PARSING_ERROR",
  "TIMEOUT_ERROR",
  "CUSTOM_ERROR",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFetchStatus(status: unknown): status is FetchBaseQueryError["status"] {
  return (
    typeof status === "number" || FETCH_ERROR_STATUSES.has(status as FetchBaseQueryError["status"])
  );
}

export function isPortfolioApiAction(action: Action): boolean {
  return action.type.startsWith(`${PORTFOLIO_REDUCER_PATH}/`);
}

/** A copy safe to log: addresses, xpubs and error bodies are replaced. */
export function redactPortfolioApiAction<A extends Action>(action: A): A {
  if (!isPortfolioApiAction(action)) return action;

  const redacted: Record<string, unknown> = { ...action };
  if ("payload" in redacted && redacted.payload !== undefined) {
    redacted.payload = redactedPayload(redacted.payload);
  }
  if ("error" in redacted && redacted.error !== undefined) redacted.error = REDACTED;
  if (isRecord(redacted.meta)) {
    const meta = { ...redacted.meta };
    if (isRecord(meta.arg)) {
      meta.arg = { ...meta.arg, originalArgs: REDACTED, queryCacheKey: REDACTED };
    }
    if (isRecord(meta.baseQueryMeta)) {
      meta.baseQueryMeta = withoutRequestAndResponse(meta.baseQueryMeta);
    }
    redacted.meta = meta;
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return redacted as A;
}

/** A copy of the store safe to export: the Portfolio slice is replaced, keys included. */
export function redactPortfolioApiState<S>(state: S): S {
  if (!isRecord(state) || !isRecord(state[PORTFOLIO_REDUCER_PATH])) return state;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { ...state, [PORTFOLIO_REDUCER_PATH]: REDACTED } as S;
}

function withoutRequestAndResponse(meta: Record<string, unknown>): Record<string, unknown> {
  const kept: Record<string, unknown> = { ...meta };
  if ("request" in kept) kept.request = REDACTED;
  if ("response" in kept) kept.response = REDACTED;
  return kept;
}

function redactedPayload(payload: unknown): unknown {
  if (!isRecord(payload) || !isFetchStatus(payload.status)) return REDACTED;
  const originalStatus =
    typeof payload.originalStatus === "number" ? { originalStatus: payload.originalStatus } : {};
  return { status: payload.status, ...originalStatus, data: REDACTED };
}
