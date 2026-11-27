import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { NOTIFICATION_KEYS, type NotificationKey } from "../types";

/** The wording ids of the legacy Notifications screen, kept so the translations stay. */
const NOTIFICATION_WORDING_IDS = {
  areNotificationsAllowed: "allowed",
  announcementsCategory: "announcements",
  largeMoverCategory: "largeMover",
  transactionsAlertsCategory: "transactionsAlerts",
  totalMarketCap: "totalMarketCap",
  topGainersLosers: "topGainersLosers",
} as const satisfies Record<NotificationKey, string>;

export type NotificationRowLabels = Readonly<{ title: string; description: string }>;

export type NotificationsSettingsLabels = Readonly<{
  rows: Readonly<Record<NotificationKey, NotificationRowLabels>>;
  osPermissionBanner: Readonly<{ title: string; description: string; action: string }>;
}>;

export function useNotificationsSettingsLabels(): NotificationsSettingsLabels {
  const { t } = useTranslation();

  return useMemo(() => {
    const rowLabels = (key: NotificationKey): NotificationRowLabels => {
      const id = NOTIFICATION_WORDING_IDS[key];
      return {
        title: t(`settings.notifications.${id}.title`),
        description: t(`settings.notifications.${id}.desc`),
      };
    };

    return {
      rows: Object.fromEntries(NOTIFICATION_KEYS.map(key => [key, rowLabels(key)])) as Record<
        NotificationKey,
        NotificationRowLabels
      >,
      osPermissionBanner: {
        title: t("settings.notifications.osPermissionBanner.title"),
        description: t("settings.notifications.osPermissionBanner.description"),
        action: t("settings.notifications.osPermissionBanner.action"),
      },
    };
  }, [t]);
}
