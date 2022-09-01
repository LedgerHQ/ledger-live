import { handleActions } from "redux-actions";
import { createSelector } from "reselect";
import { NetworkDown } from "@ledgerhq/errors";
import type { AppState, BackgroundEvent, State } from "../types/state";
import type { GetReducerPayload } from "../types/helpers";

const initialState: AppState = {
  isConnected: true,
  hasConnectedDevice: false, // NB for this current session, have we done a device action with a device.
  modalLock: false,
  backgroundEvents: [],
};

const handlers = {
  SYNC_IS_CONNECTED: (
    state: AppState,
    { payload: { isConnected } }: { payload: { isConnected: boolean | null } },
  ) => ({
    ...state,
    isConnected,
  }),
  HAS_CONNECTED_DEVICE: (
    state: AppState,
    {
      payload: { hasConnectedDevice },
    }: { payload: { hasConnectedDevice: boolean } },
  ) => ({ ...state, hasConnectedDevice }),
  SET_MODAL_LOCK: (
    state: AppState,
    { payload: { modalLock } }: { payload: { modalLock: boolean } },
  ) => ({
    ...state,
    modalLock,
  }),
  QUEUE_BACKGROUND_EVENT: (
    state: AppState,
    { payload: { event } }: { payload: { event: BackgroundEvent } },
  ) => ({
    ...state,
    backgroundEvents: [...state.backgroundEvents, event],
  }),
  DEQUEUE_BACKGROUND_EVENT: (
    state: AppState,
    _: { payload: Record<string, unknown> },
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_drop, ...tail] = state.backgroundEvents;
    return {
      ...state,
      backgroundEvents: tail,
    };
  },
  CLEAR_BACKGROUND_EVENTS: (
    state: AppState,
    _: { payload: Record<string, unknown> },
  ) => ({
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

type Payload = GetReducerPayload<typeof handlers>;

export default handleActions<AppState, Payload>(handlers, initialState);
