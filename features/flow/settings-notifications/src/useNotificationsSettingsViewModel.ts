import { useMemo } from "react";
import { useNotificationsSettingsLabels } from "./copy/useNotificationsSettingsLabels";
import { getNotificationsRows, shouldShowOsPermissionBanner } from "./logic/notificationsRows";
import type {
  NotificationsSettingsProps,
  NotificationsSettingsViewProps,
} from "./NotificationsSettings.types";
import { useNotificationsSettingsPort } from "./useNotificationsSettingsPort";
import { trackNotificationToggle } from "./tracking";

export function useNotificationsSettingsViewModel({
  testID,
}: NotificationsSettingsProps): NotificationsSettingsViewProps {
  const { values, setValue, requestOsPermission } = useNotificationsSettingsPort();
  const labels = useNotificationsSettingsLabels();

  const rows = useMemo(
    () =>
      getNotificationsRows(values).map(({ key, value, disabled }) => ({
        id: key,
        ...labels.rows[key],
        disabled,
        testID: `settings-notifications-${key}`,
        trailing: {
          type: "toggle" as const,
          value,
          onToggle: (enabled: boolean) => {
            setValue({ key, value: enabled });
            trackNotificationToggle(key, enabled);
          },
        },
      })),
    [values, labels, setValue],
  );

  const osPermissionBanner = useMemo(
    () =>
      shouldShowOsPermissionBanner(values)
        ? { ...labels.osPermissionBanner, onPressAction: requestOsPermission }
        : null,
    [values, labels, requestOsPermission],
  );

  return { rows, osPermissionBanner, testID };
}
