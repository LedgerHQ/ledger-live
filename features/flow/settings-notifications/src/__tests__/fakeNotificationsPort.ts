import type { NotificationsSettingsPort } from "../ports";
import type { NotificationsSettingsValues, NotificationUpdate } from "../types";

export const ALL_NOTIFICATIONS_ON = {
  areNotificationsAllowed: true,
  announcementsCategory: true,
  largeMoverCategory: true,
  transactionsAlertsCategory: true,
  totalMarketCap: true,
  topGainersLosers: true,
} as const;

export function createNotificationsValues(
  overrides: Partial<NotificationsSettingsValues> = {},
): NotificationsSettingsValues {
  return {
    notifications: ALL_NOTIFICATIONS_ON,
    osPermissionAuthorized: true,
    hiddenCategories: [],
    transactionsAlertsEnabled: false,
    ...overrides,
  };
}

export function createFakeNotificationsPort(overrides: Partial<NotificationsSettingsValues> = {}) {
  const updates: NotificationUpdate[] = [];
  const requestOsPermission = jest.fn();
  const port: NotificationsSettingsPort = {
    values: createNotificationsValues(overrides),
    setValue: update => {
      updates.push(update);
    },
    requestOsPermission,
  };
  return { port, updates, requestOsPermission };
}
