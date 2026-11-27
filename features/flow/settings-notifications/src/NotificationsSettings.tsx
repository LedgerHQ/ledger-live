import React from "react";
import type { NotificationsSettingsProps } from "./NotificationsSettings.types";
import { NotificationsSettingsView } from "./NotificationsSettingsView";
import { useNotificationsSettingsViewModel } from "./useNotificationsSettingsViewModel";

/** The Notifications section of the new mobile Settings, wired to the app through its port. */
export function NotificationsSettings(props: NotificationsSettingsProps) {
  return <NotificationsSettingsView {...useNotificationsSettingsViewModel(props)} />;
}
