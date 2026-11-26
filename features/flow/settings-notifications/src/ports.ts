import type { SettingsPort } from "@features/flow-settings";
import type {
  NotificationUpdate,
  NotificationsPreferences,
  NotificationsSettingsValues,
} from "./types";

/** What a toggle change does in the app, the same calls as the legacy Notifications screen. */
export type NotificationsSideEffects = Readonly<{
  setNotifications(change: Partial<NotificationsPreferences>): void;
  markUserAsOptIn(): void;
  markUserAsOptOut(): void;
  updateIdentify(): void;
  /** Sends the preferences to the marketing tool. */
  updateUserPreferences(preferences: NotificationsPreferences): void;
}>;

/**
 * The port the app provides to the Notifications section: its values, its changes, and the one
 * thing only the app can start, asking the phone for the permission.
 */
export type NotificationsSettingsPort = SettingsPort<
  NotificationsSettingsValues,
  NotificationUpdate
> &
  Readonly<{
    /** Asks the phone for the permission, or opens its settings, as the legacy banner does. */
    requestOsPermission(): void;
  }>;
