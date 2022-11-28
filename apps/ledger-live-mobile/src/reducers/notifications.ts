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
  NotificationsSetModalTypePayload,
} from "../actions/types";
import { NotificationsActionTypes } from "../actions/types";

export const INITIAL_STATE: NotificationsState = {
  isPushNotificationsModalOpen: false,
  isPushNotificationsModalLocked: false,
  notificationsModalType: "generic",
  currentRouteName: undefined,
  eventTriggered: undefined,
  dataOfUser: undefined,
};

const handlers: ReducerMap<NotificationsState, NotificationsPayload> = {
  [NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_OPEN]: (state, action) => ({
    ...state,
    isPushNotificationsModalOpen: (
      action as Action<NotificationsSetModalOpenPayload>
    ).payload.isPushNotificationsModalOpen,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_LOCKED]: (
    state,
    action,
  ) => ({
    ...state,
    isPushNotificationsModalLocked: (
      action as Action<NotificationsSetModalLockedPayload>
    ).payload.isPushNotificationsModalLocked,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_TYPE]: (state, action) => ({
    ...state,
    notificationsModalType: (action as Action<NotificationsSetModalTypePayload>)
      .payload.notificationsModalType,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_CURRENT_ROUTE_NAME]: (
    state,
    action,
  ) => ({
    ...state,
    currentRouteName: (
      action as Action<NotificationsSetCurrentRouteNamePayload>
    ).payload.currentRouteName,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_EVENT_TRIGGERED]: (
    state,
    action,
  ) => ({
    ...state,
    eventTriggered: (action as Action<NotificationsSetEventTriggeredPayload>)
      .payload.eventTriggered,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_DATA_OF_USER]: (
    state,
    action,
  ) => ({
    ...state,
    dataOfUser: (action as Action<NotificationsSetDataOfUserPayload>).payload
      .dataOfUser,
  }),
};

// Selectors
export const notificationsModalOpenSelector = (s: State) =>
  s.notifications.isPushNotificationsModalOpen;

export const notificationsModalLockedSelector = (s: State) =>
  s.notifications.isPushNotificationsModalLocked;

export const notificationsModalTypeSelector = (s: State) =>
  s.notifications.notificationsModalType;

export const notificationsCurrentRouteNameSelector = (s: State) =>
  s.notifications.currentRouteName;

export const notificationsEventTriggeredSelector = (s: State) =>
  s.notifications.eventTriggered;

export const notificationsDataOfUserSelector = (s: State) =>
  s.notifications.dataOfUser;

export default handleActions<NotificationsState, NotificationsPayload>(
  handlers,
  INITIAL_STATE,
);
