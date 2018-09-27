// @flow
/* eslint import/no-cycle: 0 */
import { handleActions } from "redux-actions";
import { createSelector } from "reselect";
import type { State } from ".";
import { NetworkDown } from "../errors";

export type AsyncState = {
  isConnected: boolean,
};

export type AppState = {
  isConnected: boolean,
};

const initialState: AppState = {
  isConnected: true,
};

const handlers: Object = {
  SYNC_IS_CONNECTED: (
    state: AppState,
    { isConnected }: { isConnected: boolean },
  ) => ({
    isConnected,
  }),
};

// Selectors

export const isConnectedSelector = (state: State) => state.appstate.isConnected;

const globalNetworkDown = new NetworkDown();

export const networkErrorSelector = createSelector(
  isConnectedSelector,
  isConnected => (!isConnected ? globalNetworkDown : null),
);

export default handleActions(handlers, initialState);
