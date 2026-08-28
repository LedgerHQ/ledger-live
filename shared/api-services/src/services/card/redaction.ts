import type { Action } from "@reduxjs/toolkit";
import { CARD_REDUCER_PATH, REDACTED } from "./constants";

/** True for any action the Card api dispatched. */
export function isCardApiAction(action: Action): boolean {
  return action.type.startsWith(`${CARD_REDUCER_PATH}/`);
}

/**
 * Strips the credential-bearing fields off a Card action and keeps everything a reader needs.
 *
 * `track: false` keeps a result out of the store; it does not stop the action. Three fields still
 * carry secrets: the fulfilled payload of either OAuth2 grant is a whole session, `meta.arg
 * .originalArgs` carries the PKCE `code_verifier`, and `meta.baseQueryMeta.request` carries the
 * `Authorization` header. The endpoint name, the request id, the action type and an error status all
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
    if ("baseQueryMeta" in meta) {
      meta.baseQueryMeta = REDACTED;
    }
    redacted.meta = meta;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return redacted as A;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
