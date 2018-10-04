// @flow

import { isConnectedSelector } from "../reducers/appstate";

export const syncIsConnected = (isConnected: boolean) => (
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
