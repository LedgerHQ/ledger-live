import type { Action } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { EARN_REDUCER_PATH } from "./constants";

const REDACTED = "[REDACTED]";

const FETCH_ERROR_STATUSES: ReadonlySet<unknown> = new Set<FetchBaseQueryError["status"]>([
  "FETCH_ERROR",
  "PARSING_ERROR",
  "TIMEOUT_ERROR",
  "CUSTOM_ERROR",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFetchStatus(status: unknown): boolean {
  return typeof status === "number" || FETCH_ERROR_STATUSES.has(status);
}

export function isEarnApiAction(action: Action): boolean {
  return action.type.startsWith(`${EARN_REDUCER_PATH}/`);
}

/**
 * A copy safe to log: wallet addresses, stake accounts and bodies are replaced, and so are the
 * cache keys and tags, which name the wallet address.
 */
export function redactEarnApiAction<A extends Action>(action: A): A {
  if (!isEarnApiAction(action)) return action;

  const actionWithoutAddresses: Record<string, unknown> = { ...action };
  if ("payload" in actionWithoutAddresses && actionWithoutAddresses.payload !== undefined) {
    actionWithoutAddresses.payload = payloadWithoutBody(actionWithoutAddresses.payload);
  }
  if ("error" in actionWithoutAddresses && actionWithoutAddresses.error !== undefined) {
    actionWithoutAddresses.error = REDACTED;
  }
  if (isRecord(actionWithoutAddresses.meta)) {
    const meta = { ...actionWithoutAddresses.meta };
    if (isRecord(meta.arg)) {
      meta.arg = { ...meta.arg, originalArgs: REDACTED, queryCacheKey: REDACTED };
    }
    if (isRecord(meta.baseQueryMeta)) {
      meta.baseQueryMeta = metaWithoutRequestAndResponse(meta.baseQueryMeta);
    }
    actionWithoutAddresses.meta = meta;
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return actionWithoutAddresses as A;
}

/** A copy of the store safe to export: the Earn slice is replaced, keys included. */
export function redactEarnApiState<S>(state: S): S {
  if (!isRecord(state) || !isRecord(state[EARN_REDUCER_PATH])) return state;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { ...state, [EARN_REDUCER_PATH]: REDACTED } as S;
}

function metaWithoutRequestAndResponse(meta: Record<string, unknown>): Record<string, unknown> {
  const metaWithoutBodies: Record<string, unknown> = { ...meta };
  if ("request" in metaWithoutBodies) metaWithoutBodies.request = REDACTED;
  if ("response" in metaWithoutBodies) metaWithoutBodies.response = REDACTED;
  return metaWithoutBodies;
}

function payloadWithoutBody(payload: unknown): unknown {
  if (!isRecord(payload) || !isFetchStatus(payload.status)) return REDACTED;
  const originalStatus =
    typeof payload.originalStatus === "number" ? { originalStatus: payload.originalStatus } : {};
  return { status: payload.status, ...originalStatus, data: REDACTED };
}
