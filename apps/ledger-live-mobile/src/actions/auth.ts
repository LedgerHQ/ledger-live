import { createAction } from "redux-actions";
import type {
  AuthInitializeStatePayload,
  AuthSetLockedPayload,
  AuthSetBiometricsErrorPayload,
  AuthSetAuthModalOpenPayload,
} from "./types";
import { AuthActionTypes } from "./types";

export const initializeAuthState = createAction<AuthInitializeStatePayload>(
  AuthActionTypes.INITIALIZE_AUTH_STATE,
);
export const setLocked = createAction<AuthSetLockedPayload>(AuthActionTypes.SET_LOCKED);
export const setBiometricsError = createAction<AuthSetBiometricsErrorPayload>(
  AuthActionTypes.SET_BIOMETRICS_ERROR,
);
export const setAuthModalOpen = createAction<AuthSetAuthModalOpenPayload>(
  AuthActionTypes.SET_AUTH_MODAL_OPEN,
);
export const lock = createAction(AuthActionTypes.LOCK);
export const unlock = createAction(AuthActionTypes.UNLOCK);
