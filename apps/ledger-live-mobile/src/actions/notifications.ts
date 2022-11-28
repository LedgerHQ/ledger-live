import { createAction } from "redux-actions";
import type { EventTrigger, DataOfUser } from "../logic/notifications";
import type {
  NotificationsSetCurrentRouteNamePayload,
  NotificationsSetDataOfUserPayload,
  NotificationsSetEventTriggeredPayload,
  NotificationsSetModalLockedPayload,
  NotificationsSetModalOpenPayload,
  NotificationsSetModalTypePayload,
} from "./types";
import { NotificationsActionTypes } from "./types";

const setNotificationsModalOpenAction =
  createAction<NotificationsSetModalOpenPayload>(
    NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_OPEN,
  );
export const setNotificationsModalOpen = (
  isPushNotificationsModalOpen: boolean,
) =>
  setNotificationsModalOpenAction({
    isPushNotificationsModalOpen,
  });

const setNotificationsModalLockedAction =
  createAction<NotificationsSetModalLockedPayload>(
    NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_LOCKED,
  );
export const setNotificationsModalLocked = (
  isPushNotificationsModalLocked: boolean,
) =>
  setNotificationsModalLockedAction({
    isPushNotificationsModalLocked,
  });

const setNotificationsModalTypeAction =
  createAction<NotificationsSetModalTypePayload>(
    NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_TYPE,
  );
export const setNotificationsModalType = (notificationsModalType: string) =>
  setNotificationsModalTypeAction({
    notificationsModalType,
  });

const setNotificationsCurrentRouteNameAction =
  createAction<NotificationsSetCurrentRouteNamePayload>(
    NotificationsActionTypes.NOTIFICATIONS_SET_CURRENT_ROUTE_NAME,
  );
export const setNotificationsCurrentRouteName = (currentRouteName?: string) =>
  setNotificationsCurrentRouteNameAction({
    currentRouteName,
  });

const setNotificationsEventTriggeredAction =
  createAction<NotificationsSetEventTriggeredPayload>(
    NotificationsActionTypes.NOTIFICATIONS_SET_EVENT_TRIGGERED,
  );
export const setNotificationsEventTriggered = (eventTriggered?: EventTrigger) =>
  setNotificationsEventTriggeredAction({
    eventTriggered,
  });

const setNotificationsDataOfUserAction =
  createAction<NotificationsSetDataOfUserPayload>(
    NotificationsActionTypes.NOTIFICATIONS_SET_DATA_OF_USER,
  );
export const setNotificationsDataOfUser = (dataOfUser?: DataOfUser) =>
  setNotificationsDataOfUserAction({
    dataOfUser,
  });
