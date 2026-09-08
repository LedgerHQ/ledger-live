import { cardManagementApi } from "@domain/api-card-management";
import { cardSession } from "@features/platform-card";
import { clearAttempt } from "./attemptStore";
import { setSignedIn } from "./slice";
import type { CardLoginDispatch } from "./createCardLoginPorts";
import type { CardLogoutPorts } from "./types";

/**
 * Binds `CardMore` to the outside world. It is its own factory, because the logout is its own
 * component: it shares the session store and the Card api with the login, and nothing else.
 */
export function createCardLogoutPorts(dispatch: CardLoginDispatch): CardLogoutPorts {
  return {
    logout: async () => {
      await dispatch(cardManagementApi.endpoints.logout.initiate()).unwrap();
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
