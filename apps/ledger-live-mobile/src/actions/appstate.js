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

export const setModalLock = (modalLock: boolean) => (dispatch: *) =>
  dispatch({ type: "SET_MODAL_LOCK", modalLock });

export const addBackgroundEvent = (event: *) => (dispatch: *) =>
  dispatch({
    type: "QUEUE_BACKGROUND_EVENT",
    event,
  });

export const dequeueBackgroundEvent = () => (dispatch: *) =>
  dispatch({
    type: "DEQUEUE_BACKGROUND_EVENT",
  });

export const clearBackgroundEvents = () => (dispatch: *) =>
  dispatch({
    type: "CLEAR_BACKGROUND_EVENTS",
  });

// TODO: migrate to TS
