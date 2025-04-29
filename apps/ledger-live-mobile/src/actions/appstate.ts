import { createAction } from "redux-actions";
import type {
  AppStateAddBackgroundEventPayload,
  AppStateSetHasConnectedDevicePayload,
  AppStateSetModalLockPayload,
  AppStateUpdateMainNavigatorVisibilityPayload,
} from "./types";
import { AppStateActionTypes } from "./types";

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

/** Set to true to prevent password lock being triggered by deep links.
 * Resets to false after a delay. Ideally remove after AuthPass refactor. */
export const blockPasswordLock = createAction<boolean>(AppStateActionTypes.SET_BLOCK_PASSWORD_LOCK);
