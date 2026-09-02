import type { Action } from "@reduxjs/toolkit";
import { CARD_GRANT_ENDPOINTS, CARD_REDUCER_PATH, REDACTED } from "./constants";

/** True for any action the Card api dispatched. */
export function isCardApiAction(action: Action): boolean {
  return action.type.startsWith(`${CARD_REDUCER_PATH}/`);
}

/**
 * Strips the sensitive fields off a Card action and keeps everything a reader needs.
 *
 * The two OAuth2 grants are endpoints, so RTK Query dispatches an action for every phase of one: the
 * argument rides on the pending action and the answer on the fulfilled one. Both are credentials —
 * an authorization code with its PKCE verifier, a refresh token, and the two rotated tokens the
 * provider answers with.
 *
 * Every Card action is stripped, not only a grant's. A payload from another endpoint is still user
 * data (`getUser` answers with an account id and a verification state), and an argument still names
 * what a user asked for. The desktop logger writes what it is given into the file users attach to a
 * support ticket, in production, so it is given none of that.
 *
 * The endpoint name, the request id, the action type, the request URL and an error status all
 * survive, so a support log still says what happened.
 *
 * Card actions only. Everything else is returned by reference.
 */
export function redactCardApiAction<A extends Action>(action: A): A {
  if (!isCardApiAction(action)) {
    return action;
  }

  const redacted: Record<string, unknown> = { ...action };

  if ("payload" in redacted && redacted.payload !== undefined) {
    // A rejected payload is the base query's error. Keep its status: that 401 is the whole story.
    redacted.payload =
      isRecord(redacted.payload) && "status" in redacted.payload
        ? { status: redacted.payload.status, data: REDACTED }
        : REDACTED;
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

/**
 * Strips the two OAuth2 grants out of the Card api's cache, for a DevTools `stateSanitizer`.
 *
 * Both grants run with `track: false`, so neither writes a cache entry and this normally finds
 * nothing. It is the second control: a grant dispatched without that option, or given a hook, would
 * otherwise park an authorization code and two tokens in the store, where DevTools serializes them.
 *
 * Only the grants. Every other Card entry stays readable, because the DevTools panel is a developer
 * machine reading its own app, and the Card cache is what a developer opens it for.
 *
 * Any state but the Card api's is returned by reference.
 */
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

/**
 * Drops the `Request` and `Response` a plain `fetchBaseQuery` reports, and keeps the rest.
 *
 * The Card base query already answers without a `meta`, so this is here for any Card action built
 * somewhere else. Whatever plain values such an action carries are worth keeping: a request URL and
 * a response status are what make a support log readable.
 */
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
