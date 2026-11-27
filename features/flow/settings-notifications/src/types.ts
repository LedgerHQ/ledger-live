import type { UpdateOf } from "@features/flow-settings";

/** The notification preferences the app stores, one toggle each. */
export const NOTIFICATION_KEYS = [
  "areNotificationsAllowed",
  "announcementsCategory",
  "largeMoverCategory",
  "transactionsAlertsCategory",
  "totalMarketCap",
  "topGainersLosers",
] as const;

export type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

export type NotificationsPreferences = Readonly<Record<NotificationKey, boolean>>;

/** One entry of the categories the app receives remotely, as the feature flag gives it. */
export type NotificationsCategoryConfig =
  | Readonly<{ category?: string | null; displayed?: boolean | null }>
  | null
  | undefined;

/** What the Notifications section reads. */
export type NotificationsSettingsValues = Readonly<{
  notifications: NotificationsPreferences;
  /** Whether the phone lets the app send notifications. */
  osPermissionAuthorized: boolean;
  /** Categories hidden remotely, see `getHiddenNotificationCategories`. */
  hiddenCategories: readonly string[];
  /** Whether the `transactionsAlerts` feature is on. */
  transactionsAlertsEnabled: boolean;
}>;

/** One toggle change. */
export type NotificationUpdate = UpdateOf<NotificationsPreferences>;
