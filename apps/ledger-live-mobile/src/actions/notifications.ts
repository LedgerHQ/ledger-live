import { createAction } from "redux-actions";
import type {
  NotificationsSetCurrentRouteNamePayload,
  NotificationsSetDataOfUserPayload,
  NotificationsSetEventTriggeredPayload,
  NotificationsSetModalLockedPayload,
  NotificationsSetModalOpenPayload,
  NotificationsSetModalTypePayload,
} from "./types";
import { NotificationsActionTypes } from "./types";

export const setNotificationsModalOpen =
  createAction<NotificationsSetModalOpenPayload>(
    NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_OPEN,
  );
export const setNotificationsModalLocked =
  createAction<NotificationsSetModalLockedPayload>(
    NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_LOCKED,
  );
export const setNotificationsModalType =
  createAction<NotificationsSetModalTypePayload>(
    NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_TYPE,
  );
export const setNotificationsCurrentRouteName =
  createAction<NotificationsSetCurrentRouteNamePayload>(
    NotificationsActionTypes.NOTIFICATIONS_SET_CURRENT_ROUTE_NAME,
  );
export const setNotificationsEventTriggered =
  createAction<NotificationsSetEventTriggeredPayload>(
    NotificationsActionTypes.NOTIFICATIONS_SET_EVENT_TRIGGERED,
  );
export const setNotificationsDataOfUser =
  createAction<NotificationsSetDataOfUserPayload>(
    NotificationsActionTypes.NOTIFICATIONS_SET_DATA_OF_USER,
  );
