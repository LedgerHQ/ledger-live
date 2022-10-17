import type { EventTrigger, DataOfUser } from "../logic/notifications";

export const setNotificationsModalOpen = (
  isPushNotificationsModalOpen: boolean,
) => ({
  type: "NOTIFICATIONS_SET_MODAL_OPEN",
  isPushNotificationsModalOpen,
});
export const setNotificationsModalLocked = (
  isPushNotificationsModalLocked: boolean,
) => ({
  type: "NOTIFICATIONS_SET_MODAL_LOCKED",
  isPushNotificationsModalLocked,
});
export const setNotificationsModalType = (notificationsModalType: string) => ({
  type: "NOTIFICATIONS_SET_MODAL_TYPE",
  notificationsModalType,
});
export const setNotificationsCurrentRouteName = (
  currentRouteName?: string,
) => ({
  type: "NOTIFICATIONS_SET_CURRENT_ROUTE_NAME",
  currentRouteName,
});
export const setNotificationsEventTriggered = (
  eventTriggered?: EventTrigger,
) => ({
  type: "NOTIFICATIONS_SET_EVENT_TRIGGERED",
  eventTriggered,
});
export const setNotificationsDataOfUser = (dataOfUser?: DataOfUser) => ({
  type: "NOTIFICATIONS_SET_DATA_OF_USER",
  dataOfUser,
});
