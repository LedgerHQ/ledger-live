import { track } from "@shared/analytics";
import type { NotificationKey } from "./types";

/** The toggle names the legacy screen sends, kept so the dashboards keep working. */
export const NOTIFICATION_TOGGLE_NAMES = {
  areNotificationsAllowed: "Toggle_Allow",
  announcementsCategory: "Toggle_Announcements",
  largeMoverCategory: "Toggle_Largemover",
  transactionsAlertsCategory: "Toggle_Transactionsalerts",
  totalMarketCap: "Toggle_Totalmarketcap",
  topGainersLosers: "Toggle_Topgainerslosers",
} as const satisfies Record<NotificationKey, string>;

export function trackNotificationToggle(key: NotificationKey, enabled: boolean) {
  track("toggle_clicked", { toggle: NOTIFICATION_TOGGLE_NAMES[key], enabled });
}
