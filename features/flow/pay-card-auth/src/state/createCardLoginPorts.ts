import { cardManagementApi } from "@domain/api-card-management";
import { cardSession, getCardSessionToken } from "@features/platform-card";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { clearAttempt, loadAttempt, saveAttempt } from "./attemptStore";
import { createAuthorizeAttempt } from "./authorizeAttempt";
import { setSignedIn } from "./slice";
import type { CardLoginPorts, OpenHostedLogin } from "./types";

/**
 * The app store's `dispatch`, used to run the Card api's `initiate` thunks. The Card api reducer must
 * be registered in that store, and `cardApiExtra` supplies its base URL and headers.
 */
export type CardLoginDispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

export type CreateCardLoginPortsConfig = {
  readonly dispatch: CardLoginDispatch;
  readonly openHostedLogin: OpenHostedLogin;
};

/**
 * Binds the login machine to the outside world: RTK Query for HTTP, the flow's own store for the PKCE
 * attempt, and `@features/platform-card` for the session. This is the only place that knows all three.
 */
export function createCardLoginPorts({
  dispatch,
  openHostedLogin,
}: CreateCardLoginPortsConfig): CardLoginPorts {
  return {
    createAttempt: createAuthorizeAttempt,
    saveAttempt,
    loadAttempt,
    clearAttempt,
    hasSession: async () => Boolean(await getCardSessionToken()),
    persistSession: session => cardSession.set(session),
    clearSession: () => cardSession.clear(),
    forgetUser: () => {
      dispatch(cardManagementApi.util.resetApiState());
    },
    exchangeAuthorizationCode: request =>
      dispatch(cardManagementApi.endpoints.exchangeAuthorizationCode.initiate(request)).unwrap(),
    getUser: async () => {
      const request = dispatch(cardManagementApi.endpoints.getUser.initiate());
      try {
        return await request.unwrap();
      } finally {
        // The answer stays in the cache for the screens that ask for it with `useGetUserQuery`.
        // The subscription must not outlive this call, because CardLogin unmounts right after.
        request.unsubscribe();
      }
    },
    setSignedIn: isSignedIn => {
      dispatch(setSignedIn(isSignedIn));
    },
    openHostedLogin,
  };
}
