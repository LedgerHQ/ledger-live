import type { ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import { CardRequestError, getCardExtra, postCardJson } from "@shared/api-services";
import { OAUTH2_TOKEN_PATH } from "./constants";
import { PayCardSessionResponseSchema } from "./schema";
import { transformPayCardSessionResponse } from "./transforms";
import type { PayCardAuthorizationCodeRequest, PayCardSession } from "./types";

/**
 * The two OAuth2 grants, as plain thunks.
 *
 * They are not endpoints, and not `createAsyncThunk` either. Both of those dispatch an action for
 * every phase of the call: the argument rides on the pending one and the answer on the fulfilled
 * one. A grant presents a credential and answers with two more, and the desktop redux logger writes
 * every action into the file users attach to a support ticket, in production, while the mobile
 * DevTools relay sends every action over a socket and takes no sanitizer.
 *
 * A plain thunk dispatches nothing. Dispatching one runs it and answers with the session, so the
 * credentials go straight to the caller and no action can carry them.
 *
 * Neither grant has a hook. A renewal is the base query's decision, and the code exchange belongs to
 * the login machine.
 */
export type CardGrantThunk = ThunkAction<Promise<PayCardSession>, unknown, unknown, UnknownAction>;

/** The `authorization_code` grant: what the hosted login's redirect is worth. */
export function exchangeAuthorizationCode(
  request: PayCardAuthorizationCodeRequest,
): CardGrantThunk {
  return (_dispatch, _getState, extra) =>
    requestSession(extra, {
      grant_type: "authorization_code",
      code: request.code,
      code_verifier: request.codeVerifier,
    });
}

/** The `refresh_token` grant: the same endpoint, separated by `grant_type`. */
export function refreshSession(refreshToken: string): CardGrantThunk {
  return (_dispatch, _getState, extra) =>
    requestSession(extra, {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
}

async function requestSession(
  extra: unknown,
  body: Record<string, string>,
): Promise<PayCardSession> {
  const response = await postCardJson(getCardExtra({ extra }), OAUTH2_TOKEN_PATH, body);

  const parsed = PayCardSessionResponseSchema.safeParse(response);
  if (!parsed.success) {
    // The body is dropped, exactly as `catchSchemaFailure` drops it elsewhere: a validation message
    // quotes what it rejected, and what it rejected is a token response.
    throw new CardRequestError(OAUTH2_TOKEN_PATH, "the provider answered no session");
  }

  return transformPayCardSessionResponse(parsed.data);
}
