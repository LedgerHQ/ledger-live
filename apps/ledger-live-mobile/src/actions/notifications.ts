import { createAction } from "redux-actions";
import type {
  NotificationsSetDataOfUserPayload,
  NotificationsSetModalOpenPayload,
  NotificationsSetDrawerSourcePayload,
  NotificationSetPermissionStatusPayload,
} from "./types";
import { NotificationsActionTypes } from "./types";

export const setNotificationsModalOpen = createAction<NotificationsSetModalOpenPayload>(
  NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_OPEN,
);
export const setNotificationsDrawerSource = createAction<NotificationsSetDrawerSourcePayload>(
  NotificationsActionTypes.NOTIFICATIONS_SET_DRAWER_SOURCE,
);
export const setNotificationsDataOfUser = createAction<NotificationsSetDataOfUserPayload>(
  NotificationsActionTypes.NOTIFICATIONS_SET_DATA_OF_USER,
);
export const setNotificationPermissionStatus = createAction<NotificationSetPermissionStatusPayload>(
  NotificationsActionTypes.NOTIFICATIONS_SET_PERMISSION_STATUS,
);
