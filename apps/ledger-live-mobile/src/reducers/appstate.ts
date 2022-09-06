import { handleActions } from "redux-actions";
import type { Action } from "redux-actions";
import { createSelector } from "reselect";
import { NetworkDown } from "@ledgerhq/errors";
import type { AppState, State } from "./types";
import type {
  AppStateAddBackgroundEventPayload,
  AppStateIsConnectedPayload,
  AppStatePayload,
  AppStateSetHasConnectedDevicePayload,
  AppStateSetModalLockPayload,
} from "../actions/types";
import { AppStateActionTypes } from "../actions/types";

const initialState: AppState = {
  isConnected: true,
  hasConnectedDevice: false, // NB for this current session, have we done a device action with a device.
  modalLock: false,
  backgroundEvents: [],
};

const handlers = {
  [AppStateActionTypes.SYNC_IS_CONNECTED]: (
    state: AppState,
    { payload: { isConnected } }: Action<AppStateIsConnectedPayload>,
  ) => ({
    ...state,
    isConnected,
  }),

  [AppStateActionTypes.HAS_CONNECTED_DEVICE]: (
    state: AppState,
    {
      payload: { hasConnectedDevice },
    }: Action<AppStateSetHasConnectedDevicePayload>,
  ) => ({ ...state, hasConnectedDevice }),

  [AppStateActionTypes.SET_MODAL_LOCK]: (
    state: AppState,
    { payload: { modalLock } }: Action<AppStateSetModalLockPayload>,
  ) => ({
    ...state,
    modalLock,
  }),

  [AppStateActionTypes.QUEUE_BACKGROUND_EVENT]: (
    state: AppState,
    { payload: { event } }: Action<AppStateAddBackgroundEventPayload>,
  ) => ({
    ...state,
    backgroundEvents: [...state.backgroundEvents, event],
  }),

  [AppStateActionTypes.DEQUEUE_BACKGROUND_EVENT]: (state: AppState) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_drop, ...tail] = state.backgroundEvents;
    return {
      ...state,
      backgroundEvents: tail,
    };
  },

  [AppStateActionTypes.CLEAR_BACKGROUND_EVENTS]: (state: AppState) => ({
    ...state,
    backgroundEvents: [],
  }),
};

// Selectors

export const isConnectedSelector = (state: State) => state.appstate.isConnected;
export const isModalLockedSelector = (state: State) => state.appstate.modalLock;
export const hasConnectedDeviceSelector = (state: State) =>
  state.appstate.hasConnectedDevice;

export const backgroundEventsSelector = (state: State) =>
  state.appstate.backgroundEvents;

export const nextBackgroundEventSelector = (state: State) =>
  state.appstate.backgroundEvents[0];

const globalNetworkDown = new NetworkDown();

export const networkErrorSelector = createSelector(
  isConnectedSelector,
  (isConnected: boolean | null) => (!isConnected ? globalNetworkDown : null),
);

export default handleActions<AppState, AppStatePayload>(handlers, initialState);
