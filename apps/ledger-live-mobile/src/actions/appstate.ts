import type { Dispatch } from "redux";
import { createAction } from "redux-actions";
import { isConnectedSelector } from "../reducers/appstate";
import type { FwUpdateBackgroundEvent, State } from "../reducers/types";
import type {
  AppStateAddBackgroundEventPayload,
  AppStateIsConnectedPayload,
  AppStateSetHasConnectedDevicePayload,
  AppStateSetModalLockPayload,
} from "./types";
import { AppStateActionTypes } from "./types";

const syncIsConnectedAction = createAction<AppStateIsConnectedPayload>(
  AppStateActionTypes.SYNC_IS_CONNECTED,
);
export const syncIsConnected =
  (isConnected: boolean | null) =>
  (dispatch: Dispatch, getState: () => State) => {
    const currently = isConnectedSelector(getState());

    if (currently !== isConnected) {
      dispatch(syncIsConnectedAction({ isConnected }));
    }
  };

export const openDebugMenu = createAction(
  AppStateActionTypes.DEBUG_MENU_VISIBLE,
);

const setHasConnectedDeviceAction =
  createAction<AppStateSetHasConnectedDevicePayload>(
    AppStateActionTypes.HAS_CONNECTED_DEVICE,
  );
export const setHasConnectedDevice =
  (hasConnectedDevice: boolean) => (dispatch: Dispatch) =>
    dispatch(setHasConnectedDeviceAction({ hasConnectedDevice }));

const setModalLockAction = createAction<AppStateSetModalLockPayload>(
  AppStateActionTypes.SET_MODAL_LOCK,
);
export const setModalLock = (modalLock: boolean) => (dispatch: Dispatch) =>
  dispatch(
    setModalLockAction({
      modalLock,
    }),
  );

const addBackgroundEventAction =
  createAction<AppStateAddBackgroundEventPayload>(
    AppStateActionTypes.QUEUE_BACKGROUND_EVENT,
  );
export const addBackgroundEvent = (event: FwUpdateBackgroundEvent) =>
  addBackgroundEventAction({
    event,
  });

const dequeueBackgroundEventAction = createAction(
  AppStateActionTypes.DEQUEUE_BACKGROUND_EVENT,
);
export const dequeueBackgroundEvent = () => (dispatch: Dispatch) =>
  dispatch(dequeueBackgroundEventAction());

const clearBackgroundEventsAction = createAction(
  AppStateActionTypes.CLEAR_BACKGROUND_EVENTS,
);
export const clearBackgroundEvents = () => (dispatch: Dispatch) =>
  dispatch(clearBackgroundEventsAction());
