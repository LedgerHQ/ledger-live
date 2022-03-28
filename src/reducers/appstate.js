// @flow
/* eslint import/no-cycle: 0 */
import { handleActions } from "redux-actions";
import { createSelector } from "reselect";
import { NetworkDown } from "@ledgerhq/errors";
import type { State } from ".";

export type AsyncState = {
  isConnected: boolean | null,
};

export type AppState = {
  isConnected: boolean | null,
  hasConnectedDevice: boolean,
  modalLock: boolean,
  backgroundEvents: Array<Object>, // TODO type this properly
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
  ADD_BACKGROUND_EVENT: (state: AppState, { event }: *) => ({
    ...state,
    backgroundEvents: [event, ...state.backgroundEvents].slice(0, 10), // Don't think we need more, probably only one to be honest
  }),
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

const globalNetworkDown = new NetworkDown();

// $FlowFixMe
export const networkErrorSelector = createSelector(
  isConnectedSelector,
  isConnected => (!isConnected ? globalNetworkDown : null),
);

export default handleActions(handlers, initialState);
