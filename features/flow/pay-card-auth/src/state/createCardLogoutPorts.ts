import { cardManagementApi, initiatePayCardLogout } from "@domain/api-card-management";
import { cardSession, getCardSessionToken } from "@features/platform-card";
import { clearAttempt } from "./attemptStore";
import { setSignedIn } from "./slice";
import type { CardLoginDispatch } from "./createCardLoginPorts";
import type { CardLogoutPorts } from "./types";

/**
 * Binds `More` to the outside world. It is its own factory, because the logout is its own
 * component: it shares the session store and the Card api with the login, and nothing else.
 */
export function createCardLogoutPorts(dispatch: CardLoginDispatch): CardLogoutPorts {
  return {
    logout: async () => {
      const accessToken = await getCardSessionToken();
      await dispatch(initiatePayCardLogout(accessToken)).unwrap();
    },
    clearSession: () => cardSession.clear(),
    clearAttempt,
    forgetUser: () => {
      dispatch(cardManagementApi.util.resetApiState());
    },
    setSignedIn: isSignedIn => {
      dispatch(setSignedIn(isSignedIn));
    },
  };
}
