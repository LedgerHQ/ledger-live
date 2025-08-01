import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import type { AuthState, State } from "./types";
import type {
  AuthPayload,
  AuthInitializeStatePayload,
  AuthSetLockedPayload,
  AuthSetBiometricsErrorPayload,
  AuthSetAuthModalOpenPayload,
} from "../actions/types";
import { AuthActionTypes } from "../actions/types";

export const INITIAL_STATE: AuthState = {
  isLocked: false,
  biometricsError: null,
  authModalOpen: false,
};

const handlers: ReducerMap<AuthState, AuthPayload> = {
  [AuthActionTypes.INITIALIZE_AUTH_STATE]: (state, action) => ({
    ...state,
    isLocked: !!(action as Action<AuthInitializeStatePayload>)?.payload.privacy?.hasPassword,
  }),
  [AuthActionTypes.SET_LOCKED]: (state, action) => ({
    ...state,
    isLocked: (action as Action<AuthSetLockedPayload>).payload,
  }),
  [AuthActionTypes.SET_BIOMETRICS_ERROR]: (state, action) => ({
    ...state,
    biometricsError: (action as Action<AuthSetBiometricsErrorPayload>).payload,
  }),
  [AuthActionTypes.SET_AUTH_MODAL_OPEN]: (state, action) => ({
    ...state,
    authModalOpen: (action as Action<AuthSetAuthModalOpenPayload>).payload,
  }),
  [AuthActionTypes.LOCK]: state => ({
    ...state,
    isLocked: true,
    biometricsError: null,
  }),
  [AuthActionTypes.UNLOCK]: state => ({
    ...state,
    isLocked: false,
    biometricsError: null,
  }),
};

export const isLockedSelector = (state: State) => state.auth.isLocked;
export const biometricsErrorSelector = (state: State) => state.auth.biometricsError;
export const authModalOpenSelector = (state: State) => state.auth.authModalOpen;

export default handleActions<AuthState, AuthPayload>(handlers, INITIAL_STATE);
