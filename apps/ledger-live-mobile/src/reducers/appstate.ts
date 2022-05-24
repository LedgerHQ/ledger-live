import { handleActions } from "redux-actions";
import { createSelector } from "reselect";
import { NetworkDown } from "@ledgerhq/errors";
import type { State } from ".";

export type AsyncState = {
  isConnected: boolean | null,
};

export type BackgroundEvent = {
  type: "confirmPin"
} | {
  type: "downloadingUpdate",
  progress?: number
} | {
  type: "confirmUpdate"
} | {
  type: "flashingMcu",
  progress?: number,
  installing?: string | null,
} | {
  type: "firmwareUpdated"
} | {
  type: "error",
  error: any
};

export type AppState = {
  isConnected: boolean | null,
  hasConnectedDevice: boolean,
  modalLock: boolean,
  backgroundEvents: Array<BackgroundEvent>,
};

const initialState: AppState = {
  isConnected: true,
  hasConnectedDevice: false, // NB for this current session, have we done a device action with a device.
  modalLock: false,
  backgroundEvents: [],
};

const handlers: Object = {
  SYNC_IS_CONNECTED: (
    state: AppState,
    { isConnected }: { isConnected: boolean | null },
  ) => ({
    ...state,
    isConnected,
  }),
  HAS_CONNECTED_DEVICE: (
    state: AppState,
    { hasConnectedDevice }: { hasConnectedDevice: boolean },
  ) => ({ ...state, hasConnectedDevice }),
  SET_MODAL_LOCK: (state: AppState, { modalLock }: { modalLock: boolean }) => ({
    ...state,
    modalLock,
  }),
  QUEUE_BACKGROUND_EVENT: (state: AppState, { event }: any) => ({
    ...state,
    backgroundEvents: [...state.backgroundEvents, event],
  }),
  DEQUEUE_BACKGROUND_EVENT: (state: AppState) => {
    const [_, ...tail] = state.backgroundEvents;
    return ({
      ...state,
      backgroundEvents: tail,
    });
  },
  CLEAR_BACKGROUND_EVENTS: (state: AppState) => ({
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

// $FlowFixMe
export const networkErrorSelector = createSelector(
  isConnectedSelector,
  (isConnected: boolean) => (!isConnected ? globalNetworkDown : null),
);

export default handleActions(handlers, initialState);
