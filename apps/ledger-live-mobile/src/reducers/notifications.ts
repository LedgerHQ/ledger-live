import { handleActions } from "redux-actions";
import type { State } from ".";
import type { EventTrigger, DataOfUser } from "../logic/notifications";
import { GetReducerPayload } from "../types/helpers";

export type NotificationsState = {
  /** Boolean indicating whether the push notifications modal is opened or closed */
  isPushNotificationsModalOpen: boolean;
  /** Type of the push notifications modal to display (either the generic one or the market one) */
  notificationsModalType: string;
  /** The route name of the current screen displayed in the app, it is updated every time the displayed screen change */
  currentRouteName?: string;
  /** The event that triggered the oppening of the push notifications modal */
  eventTriggered?: EventTrigger;
  /** Data related to the user's app usage. We use this data to prompt the push notifications modal on certain conditions only */
  dataOfUser?: DataOfUser;
  /**
   * Used to avoid having multiple different modals opened at the same time (for example the push notifications and the ratings ones)
   * If true, it means another modal is already opened or being opened
   */
  isPushNotificationsModalLocked: boolean;
};

const initialState: NotificationsState = {
  isPushNotificationsModalOpen: false,
  isPushNotificationsModalLocked: false,
  notificationsModalType: "generic",
  currentRouteName: undefined,
  eventTriggered: undefined,
  dataOfUser: undefined,
};

const handlers = {
  NOTIFICATIONS_SET_MODAL_OPEN: (
    state: NotificationsState,
    {
      payload: { isPushNotificationsModalOpen },
    }: { payload: { isPushNotificationsModalOpen: boolean } },
  ) => ({
    ...state,
    isPushNotificationsModalOpen,
  }),
  NOTIFICATIONS_SET_MODAL_LOCKED: (
    state: NotificationsState,
    {
      payload: { isPushNotificationsModalLocked },
    }: { payload: { isPushNotificationsModalLocked: boolean } },
  ) => ({
    ...state,
    isPushNotificationsModalLocked,
  }),
  NOTIFICATIONS_SET_MODAL_TYPE: (
    state: NotificationsState,
    {
      payload: { notificationsModalType },
    }: { payload: { notificationsModalType: string } },
  ) => ({
    ...state,
    notificationsModalType,
  }),
  NOTIFICATIONS_SET_CURRENT_ROUTE_NAME: (
    state: NotificationsState,
    {
      payload: { currentRouteName },
    }: { payload: { currentRouteName?: string } },
  ) => ({
    ...state,
    currentRouteName,
  }),
  NOTIFICATIONS_SET_EVENT_TRIGGERED: (
    state: NotificationsState,
    {
      payload: { eventTriggered },
    }: { payload: { eventTriggered?: EventTrigger } },
  ) => ({
    ...state,
    eventTriggered,
  }),
  NOTIFICATIONS_SET_DATA_OF_USER: (
    state: NotificationsState,
    { payload: { dataOfUser } }: { payload: { dataOfUser?: DataOfUser } },
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

type Payload = GetReducerPayload<typeof handlers>;

export default handleActions<NotificationsState, Payload>(
  handlers,
  initialState,
);
