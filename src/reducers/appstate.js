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
};

const initialState: AppState = {
  isConnected: true,
  hasConnectedDevice: false, // NB for this current session, have we done a device action with a device.
  modalLock: false,
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
};

// Selectors

export const isConnectedSelector = (state: State) => state.appstate.isConnected;
export const isModalLockedSelector = (state: State) => state.appstate.modalLock;
export const hasConnectedDeviceSelector = (state: State) =>
  state.appstate.hasConnectedDevice;

const globalNetworkDown = new NetworkDown();

// $FlowFixMe
export const networkErrorSelector = createSelector(
  isConnectedSelector,
  isConnected => (!isConnected ? globalNetworkDown : null),
);

export default handleActions(handlers, initialState);
