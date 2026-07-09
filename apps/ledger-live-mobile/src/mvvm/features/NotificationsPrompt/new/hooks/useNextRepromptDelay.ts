import { useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { notificationsSelector } from "~/reducers/settings";
import { getNextRepromptDelay, useNotificationsData } from "LLM/features/NotificationsPrompt";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";

export function useNextRepromptDelay() {
  const featureBrazePushNotifications = useFeature("brazePushNotifications");
  const notifications = useSelector(notificationsSelector);
  const { permissionStatus } = useNotificationsPermission();
  const { pushNotificationsDataOfUser } = useNotificationsData();

  return useMemo(
    () =>
      getNextRepromptDelay({
        repromptSchedule: featureBrazePushNotifications?.params?.reprompt_schedule,
        pushNotificationsDataOfUser,
        permissionStatus,
        areNotificationsAllowed: notifications.areNotificationsAllowed,
        transactionsAlertsCategory: notifications.transactionsAlertsCategory,
      }),
    [
      featureBrazePushNotifications?.params?.reprompt_schedule,
      pushNotificationsDataOfUser,
      permissionStatus,
      notifications.areNotificationsAllowed,
      notifications.transactionsAlertsCategory,
    ],
  );
}
