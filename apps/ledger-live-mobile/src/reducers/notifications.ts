import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import type { NotificationsState, State } from "./types";
import type {
  NotificationsPayload,
  NotificationsSetCurrentRouteNamePayload,
  NotificationsSetDataOfUserPayload,
  NotificationsSetEventTriggeredPayload,
  NotificationsSetModalLockedPayload,
  NotificationsSetModalOpenPayload,
  NotificationsSetDrawerSourcePayload,
  DangerouslyOverrideStatePayload,
  NotificationSetPermissionStatusPayload,
} from "../actions/types";
import { NotificationsActionTypes } from "../actions/types";

export const INITIAL_STATE: NotificationsState = {
  isPushNotificationsModalOpen: false,
  isPushNotificationsModalLocked: false,
  drawerSource: "generic",
  currentRouteName: undefined,
  eventTriggered: undefined,
  dataOfUser: undefined,
  permissionStatus: undefined,
};

const handlers: ReducerMap<NotificationsState, NotificationsPayload> = {
  [NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_OPEN]: (state, action) => ({
    ...state,
    isPushNotificationsModalOpen: (action as Action<NotificationsSetModalOpenPayload>).payload,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_LOCKED]: (state, action) => ({
    ...state,
    isPushNotificationsModalLocked: (action as Action<NotificationsSetModalLockedPayload>).payload,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_DRAWER_SOURCE]: (state, action) => ({
    ...state,
    drawerSource: (action as Action<NotificationsSetDrawerSourcePayload>).payload,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_CURRENT_ROUTE_NAME]: (state, action) => ({
    ...state,
    currentRouteName: (action as Action<NotificationsSetCurrentRouteNamePayload>).payload,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_EVENT_TRIGGERED]: (state, action) => ({
    ...state,
    eventTriggered: (action as Action<NotificationsSetEventTriggeredPayload>).payload,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_DATA_OF_USER]: (state, action) => ({
    ...state,
    dataOfUser: (action as Action<NotificationsSetDataOfUserPayload>).payload,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_PERMISSION_STATUS]: (state, action) => ({
    ...state,
    permissionStatus: (action as Action<NotificationSetPermissionStatusPayload>).payload,
  }),
  [NotificationsActionTypes.DANGEROUSLY_OVERRIDE_STATE]: (
    state: NotificationsState,
    action,
  ): NotificationsState => ({
    ...state,
    ...(action as Action<DangerouslyOverrideStatePayload>).payload.notifications,
  }),
};

// Selectors
export const notificationsModalOpenSelector = (s: State) =>
  s.notifications.isPushNotificationsModalOpen;

export const notificationsModalLockedSelector = (s: State) =>
  s.notifications.isPushNotificationsModalLocked;

export const drawerSourceSelector = (s: State) => s.notifications.drawerSource;

export const notificationsCurrentRouteNameSelector = (s: State) => s.notifications.currentRouteName;

export const notificationsEventTriggeredSelector = (s: State) => s.notifications.eventTriggered;

export const notificationsDataOfUserSelector = (s: State) => s.notifications.dataOfUser;

export const notificationsPermissionStatusSelector = (s: State) => s.notifications.permissionStatus;

export default handleActions<NotificationsState, NotificationsPayload>(handlers, INITIAL_STATE);
