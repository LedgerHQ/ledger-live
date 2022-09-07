import { handleActions } from "redux-actions";
import type { Action } from "redux-actions";
import type { NotificationsState, State } from "./types";
import type { EventTrigger, DataOfUser } from "../logic/notifications";
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

const initialState: NotificationsState = {
  isPushNotificationsModalOpen: false,
  isPushNotificationsModalLocked: false,
  notificationsModalType: "generic",
  currentRouteName: undefined,
  eventTriggered: undefined,
  dataOfUser: undefined,
};

const handlers = {
  [NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_OPEN]: (
    state: NotificationsState,
    {
      payload: { isPushNotificationsModalOpen },
    }: Action<NotificationsSetModalOpenPayload>,
  ) => ({
    ...state,
    isPushNotificationsModalOpen,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_LOCKED]: (
    state: NotificationsState,
    {
      payload: { isPushNotificationsModalLocked },
    }: Action<NotificationsSetModalLockedPayload>,
  ) => ({
    ...state,
    isPushNotificationsModalLocked,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_MODAL_TYPE]: (
    state: NotificationsState,
    {
      payload: { notificationsModalType },
    }: Action<NotificationsSetModalTypePayload>,
  ) => ({
    ...state,
    notificationsModalType,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_CURRENT_ROUTE_NAME]: (
    state: NotificationsState,
    {
      payload: { currentRouteName },
    }: Action<NotificationsSetCurrentRouteNamePayload>,
  ) => ({
    ...state,
    currentRouteName,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_EVENT_TRIGGERED]: (
    state: NotificationsState,
    {
      payload: { eventTriggered },
    }: Action<NotificationsSetEventTriggeredPayload>,
  ) => ({
    ...state,
    eventTriggered,
  }),
  [NotificationsActionTypes.NOTIFICATIONS_SET_DATA_OF_USER]: (
    state: NotificationsState,
    { payload: { dataOfUser } }: Action<NotificationsSetDataOfUserPayload>,
  ) => ({
    ...state,
    dataOfUser,
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
  initialState,
);
