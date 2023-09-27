import type { Dispatch } from "redux";
import { createAction } from "redux-actions";
import { isConnectedSelector } from "../reducers/appstate";
import type { State } from "../reducers/types";
import type {
  AppStateAddBackgroundEventPayload,
  AppStateIsConnectedPayload,
  AppStateSetHasConnectedDevicePayload,
  AppStateSetModalLockPayload,
  AppStateUpdateMainNavigatorVisibilityPayload,
} from "./types";
import { AppStateActionTypes } from "./types";

const syncIsConnectedAction = createAction<AppStateIsConnectedPayload>(
  AppStateActionTypes.SYNC_IS_CONNECTED,
);
export const syncIsConnected =
  (isConnected: boolean | null) => (dispatch: Dispatch, getState: () => State) => {
    const currently = isConnectedSelector(getState());

    if (currently !== isConnected) {
      dispatch(syncIsConnectedAction(isConnected));
    }
  };
export const openDebugMenu = createAction(AppStateActionTypes.DEBUG_MENU_VISIBLE);
export const setHasConnectedDevice = createAction<AppStateSetHasConnectedDevicePayload>(
  AppStateActionTypes.HAS_CONNECTED_DEVICE,
);
export const setModalLock = createAction<AppStateSetModalLockPayload>(
  AppStateActionTypes.SET_MODAL_LOCK,
);
export const addBackgroundEvent = createAction<AppStateAddBackgroundEventPayload>(
  AppStateActionTypes.QUEUE_BACKGROUND_EVENT,
);
export const dequeueBackgroundEvent = createAction(AppStateActionTypes.DEQUEUE_BACKGROUND_EVENT);
export const clearBackgroundEvents = createAction(AppStateActionTypes.CLEAR_BACKGROUND_EVENTS);
export const updateMainNavigatorVisibility =
  createAction<AppStateUpdateMainNavigatorVisibilityPayload>(
    AppStateActionTypes.UPDATE_MAIN_NAVIGATOR_VISIBILITY,
  );

/** Set to true to prevent privacy lock being triggered by deep links. Reset to false on re-focus or on close. */
export const setIsDeepLinking = createAction<boolean>(AppStateActionTypes.SET_IS_DEEP_LINKING);
