import { isConnectedSelector } from "../reducers/appstate";

export const syncIsConnected =
  (isConnected: boolean | null) => (dispatch: any, getState: any) => {
    const currently = isConnectedSelector(getState());

    if (currently !== isConnected) {
      dispatch({
        type: "SYNC_IS_CONNECTED",
        isConnected,
      });
    }
  };
export const setHasConnectedDevice =
  (hasConnectedDevice: boolean) => (dispatch: any) =>
    dispatch({
      type: "HAS_CONNECTED_DEVICE",
      hasConnectedDevice,
    });
export const setModalLock = (modalLock: boolean) => (dispatch: any) =>
  dispatch({
    type: "SET_MODAL_LOCK",
    modalLock,
  });
export const addBackgroundEvent = (event: any) => (dispatch: any) =>
  dispatch({
    type: "QUEUE_BACKGROUND_EVENT",
    event,
  });
export const dequeueBackgroundEvent = () => (dispatch: any) =>
  dispatch({
    type: "DEQUEUE_BACKGROUND_EVENT",
  });
export const clearBackgroundEvents = () => (dispatch: any) =>
  dispatch({
    type: "CLEAR_BACKGROUND_EVENTS",
  });
