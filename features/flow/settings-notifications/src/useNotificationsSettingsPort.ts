import { useSettingsPort } from "@features/flow-settings";
import type { NotificationsSettingsPort } from "./ports";

/** The Notifications part of the port the app provides to the Settings. */
export function useNotificationsSettingsPort(): NotificationsSettingsPort {
  return useSettingsPort<NotificationsSettingsPort>();
}
