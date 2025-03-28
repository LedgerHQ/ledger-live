import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import type { AppState, State } from "./types";

import type {
  AppStateAddBackgroundEventPayload,
  AppStateBlockPasswordLockPayload,
  AppStatePayload,
  AppStateSetHasConnectedDevicePayload,
  AppStateSetModalLockPayload,
  AppStateUpdateMainNavigatorVisibilityPayload,
  DangerouslyOverrideStatePayload,
} from "../actions/types";
import { AppStateActionTypes, EarnActionTypes } from "../actions/types";

export type AsyncState = {
  isConnected: boolean | null;
};

export const INITIAL_STATE: AppState = {
  isConnected: true,
  hasConnectedDevice: false, // NB for this current session, have we done a device action with a device.
  modalLock: false,
  backgroundEvents: [],
  debugMenuVisible: false,
  isMainNavigatorVisible: true,
  isPasswordLockBlocked: false,
};

const handlers: ReducerMap<AppState, AppStatePayload> = {
  [AppStateActionTypes.DEBUG_MENU_VISIBLE]: state => ({
    ...state,
    debugMenuVisible: true,
  }),

  [AppStateActionTypes.HAS_CONNECTED_DEVICE]: (state, action) => ({
    ...state,
    hasConnectedDevice: (action as Action<AppStateSetHasConnectedDevicePayload>).payload,
  }),

  [AppStateActionTypes.SET_MODAL_LOCK]: (state, action) => ({
    ...state,
    modalLock: (action as Action<AppStateSetModalLockPayload>).payload,
  }),

  [AppStateActionTypes.QUEUE_BACKGROUND_EVENT]: (state, action) => ({
    ...state,
    backgroundEvents: [
      ...state.backgroundEvents,
      (action as Action<AppStateAddBackgroundEventPayload>).payload.event,
    ],
  }),

  [AppStateActionTypes.DEQUEUE_BACKGROUND_EVENT]: (state: AppState) => {
    const [_, ...tail] = state.backgroundEvents;
    return {
      ...state,
      backgroundEvents: tail,
    };
  },

  [AppStateActionTypes.CLEAR_BACKGROUND_EVENTS]: (state: AppState) => ({
    ...state,
    backgroundEvents: [],
  }),

  [AppStateActionTypes.DANGEROUSLY_OVERRIDE_STATE]: (state: AppState, action): AppState => ({
    ...state,
    ...(action as Action<DangerouslyOverrideStatePayload>).payload.appstate,
  }),

  [AppStateActionTypes.UPDATE_MAIN_NAVIGATOR_VISIBILITY]: (state, action) => ({
    ...state,
    isMainNavigatorVisible: (action as Action<AppStateUpdateMainNavigatorVisibilityPayload>)
      .payload,
  }),

  /** Prevents deep links from triggering privacy lock. See AuthPass. */
  [AppStateActionTypes.SET_BLOCK_PASSWORD_LOCK]: (state, action) => ({
    ...state,
    isPasswordLockBlocked: (action as Action<AppStateBlockPasswordLockPayload>)?.payload || false,
  }),

  [EarnActionTypes.EARN_INFO_MODAL]: state => ({
    ...state,
    isPasswordLockBlocked: true,
  }),
};

// Selectors

export const isDebugMenuVisible = (state: State) => state.appstate.debugMenuVisible;
export const isModalLockedSelector = (state: State) => state.appstate.modalLock;
export const hasConnectedDeviceSelector = (state: State) => state.appstate.hasConnectedDevice;

export const backgroundEventsSelector = (state: State) => state.appstate.backgroundEvents;

export const nextBackgroundEventSelector = (state: State) => state.appstate.backgroundEvents[0];

export const isMainNavigatorVisibleSelector = (state: State) =>
  state.appstate.isMainNavigatorVisible;

export const isPasswordLockBlocked = (state: State) => state.appstate.isPasswordLockBlocked;

export default handleActions<AppState, AppStatePayload>(handlers, INITIAL_STATE);
