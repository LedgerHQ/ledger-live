// @flow

import { isConnectedSelector } from "../reducers/appstate";

export const syncIsConnected = (isConnected: boolean | null) => (
  dispatch: *,
  getState: *,
) => {
  const currently = isConnectedSelector(getState());
  if (currently !== isConnected) {
    dispatch({
      type: "SYNC_IS_CONNECTED",
      isConnected,
    });
  }
};

export const setHasConnectedDevice = (hasConnectedDevice: boolean) => (
  dispatch: *,
) => dispatch({ type: "HAS_CONNECTED_DEVICE", hasConnectedDevice });
