import type { Action } from "@reduxjs/toolkit";
import { CARD_REDUCER_PATH, REDACTED } from "./constants";

/** True for any action the Card api dispatched. */
export function isCardApiAction(action: Action): boolean {
  return action.type.startsWith(`${CARD_REDUCER_PATH}/`);
}

/**
 * Strips the sensitive fields off a Card action and keeps everything a reader needs.
 *
 * No Card action carries a credential any more: neither grant returns a session (they hand it over
 * through `receiveCardSession` and answer with a handle), neither grant takes one as an argument,
 * and the base query answers with a `meta` of three plain values rather than the `Request` whose
 * headers hold the Bearer. This is the second control, not the only one, and it covers the rest: a
 * payload is still user data (`getUser` answers with an id and a verification state), and an
 * argument still names what a user asked for.
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
 * Drops the `Request` and `Response` a plain `fetchBaseQuery` reports, and keeps the rest.
 *
 * The Card base query already answers with three plain values instead of those two objects, so this
 * is here for any Card action built somewhere else. The plain values are worth keeping: a request
 * URL and a response status are what make a support log readable.
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
