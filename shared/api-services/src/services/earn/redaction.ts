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
  return { ...action, ...redactedFieldsOf(action) };
}

type ActionFields = Action & Readonly<{ payload?: unknown; error?: unknown; meta?: unknown }>;

/** The fields of an Earn action that name a wallet address or a stake account, redacted. */
function redactedFieldsOf(action: ActionFields): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (action.payload !== undefined) fields.payload = payloadWithoutBody(action.payload);
  if (action.error !== undefined) fields.error = REDACTED;
  if (isRecord(action.meta)) {
    const meta = { ...action.meta };
    if (isRecord(meta.arg)) {
      meta.arg = { ...meta.arg, originalArgs: REDACTED, queryCacheKey: REDACTED };
    }
    if (isRecord(meta.baseQueryMeta)) {
      meta.baseQueryMeta = metaWithoutRequestAndResponse(meta.baseQueryMeta);
    }
    fields.meta = meta;
  }
  return fields;
}

/** A copy of the store safe to export: the Earn slice is replaced, keys included. */
export function redactEarnApiState<S>(state: S): S {
  if (!isRecord(state) || !isRecord(state[EARN_REDUCER_PATH])) return state;
  return { ...state, [EARN_REDUCER_PATH]: REDACTED };
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
