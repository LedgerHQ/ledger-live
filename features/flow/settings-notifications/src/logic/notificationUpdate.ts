import type { NotificationsSideEffects } from "../ports";
import type { NotificationUpdate, NotificationsSettingsValues } from "../types";

type UpdateContext = Pick<NotificationsSettingsValues, "notifications" | "osPermissionAuthorized">;

/**
 * Runs a toggle change with the side effects of the legacy Notifications screen, in the same
 * order: store, opt-in or opt-out, identify, then the marketing tool preferences.
 */
export function applyNotificationUpdate(
  { key, value }: NotificationUpdate,
  { notifications, osPermissionAuthorized }: UpdateContext,
  sideEffects: NotificationsSideEffects,
): void {
  sideEffects.setNotifications({ [key]: value });

  if (key === "areNotificationsAllowed") {
    if (!value) {
      sideEffects.markUserAsOptOut();
    } else if (osPermissionAuthorized) {
      sideEffects.markUserAsOptIn();
    }
  }

  sideEffects.updateIdentify();
  sideEffects.updateUserPreferences({ ...notifications, [key]: value });
}
