import type { Dispatch } from "redux";
import { createAction } from "redux-actions";
import { isConnectedSelector } from "../reducers/appstate";
import { BackgroundEvent, State } from "../types/state";

export const syncIsConnected =
  (isConnected: boolean | null) =>
  (dispatch: Dispatch, getState: () => State) => {
    const currently = isConnectedSelector(getState());

    if (currently !== isConnected) {
      dispatch({
        type: "SYNC_IS_CONNECTED",
        payload: { isConnected },
      });
    }
  };
export const setHasConnectedDevice =
  (hasConnectedDevice: boolean) => (dispatch: Dispatch) =>
    dispatch({
      type: "HAS_CONNECTED_DEVICE",
      payload: { hasConnectedDevice },
    });
export const setModalLock = (modalLock: boolean) => (dispatch: Dispatch) =>
  dispatch({
    type: "SET_MODAL_LOCK",
    modalLock,
  });
export const addBackgroundEvent =
  (event: BackgroundEvent) => (dispatch: Dispatch) =>
    dispatch({
      type: "QUEUE_BACKGROUND_EVENT",
      event,
    });
export const dequeueBackgroundEvent = () => (dispatch: Dispatch) =>
  dispatch({
    type: "DEQUEUE_BACKGROUND_EVENT",
  });
export const clearBackgroundEvents = () => (dispatch: Dispatch) =>
  dispatch({
    type: "CLEAR_BACKGROUND_EVENTS",
  });
