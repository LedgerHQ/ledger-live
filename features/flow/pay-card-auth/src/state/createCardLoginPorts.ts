import { cardManagementApi } from "@domain/api-card-management";
import { cardSession, getCardSessionToken, setCardProviderAppId } from "@features/platform-card";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { clearAttempt, loadAttempt, saveAttempt } from "./attemptStore";
import { createAuthorizeAttempt } from "./authorizeAttempt";
import { setSignedIn } from "./slice";
import type { CardLoginPorts, OpenHostedLogin } from "./types";

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
    persistSession: async session => {
      await cardSession.set(session);
      dispatch(cardManagementApi.util.resetApiState());
    },
    clearSession: () => cardSession.clear(),
    forgetUser: () => {
      dispatch(cardManagementApi.util.resetApiState());
    },
    exchangeAuthorizationCode: request =>
      dispatch(
        cardManagementApi.endpoints.exchangeAuthorizationCode.initiate(request, { track: false }),
      ).unwrap(),
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
    setProviderAppId: appId => {
      // The store call is not awaited: it holds the value for later requests, while the exchange
      // that follows this line reads the in-memory mirror the call already set.
      void setCardProviderAppId(appId);
    },
    openHostedLogin,
  };
}
