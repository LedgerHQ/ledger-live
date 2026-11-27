import type { NotificationKey, NotificationsSettingsValues } from "../types";

/** The rows in the order of the design: Allow notifications first, then the categories. */
export const NOTIFICATIONS_ROWS = [
  "areNotificationsAllowed",
  "announcementsCategory",
  "totalMarketCap",
  "largeMoverCategory",
  "topGainersLosers",
  "transactionsAlertsCategory",
] as const satisfies readonly NotificationKey[];

export type NotificationsRow = Readonly<{
  key: NotificationKey;
  value: boolean;
  disabled: boolean;
}>;

type Visibility = Pick<
  NotificationsSettingsValues,
  "hiddenCategories" | "transactionsAlertsEnabled"
>;

/**
 * A category hidden remotely is not shown. Transaction alerts are hidden only while the
 * `transactionsAlerts` feature is on, as in the legacy screen.
 */
export function isNotificationsRowShown(
  key: NotificationKey,
  { hiddenCategories, transactionsAlertsEnabled }: Visibility,
): boolean {
  if (key === "areNotificationsAllowed") return true;
  const isHiddenRemotely = hiddenCategories.includes(key);
  if (key === "transactionsAlertsCategory") return !(transactionsAlertsEnabled && isHiddenRemotely);
  return !isHiddenRemotely;
}

/**
 * Every toggle is disabled while the phone blocks notifications; the categories are also
 * disabled while Allow notifications is off.
 */
export function isNotificationsRowDisabled(
  key: NotificationKey,
  { notifications, osPermissionAuthorized }: NotificationsSettingsValues,
): boolean {
  if (!osPermissionAuthorized) return true;
  return key !== "areNotificationsAllowed" && !notifications.areNotificationsAllowed;
}

export function getNotificationsRows(values: NotificationsSettingsValues): NotificationsRow[] {
  return NOTIFICATIONS_ROWS.filter(key => isNotificationsRowShown(key, values)).map(key => ({
    key,
    value: values.notifications[key],
    disabled: isNotificationsRowDisabled(key, values),
  }));
}

/** The banner shows while the phone blocks notifications. */
export function shouldShowOsPermissionBanner({
  osPermissionAuthorized,
}: Pick<NotificationsSettingsValues, "osPermissionAuthorized">): boolean {
  return !osPermissionAuthorized;
}
