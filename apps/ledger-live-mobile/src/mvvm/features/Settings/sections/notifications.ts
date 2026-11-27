import { useCallback, useMemo } from "react";
import { useRoute } from "@react-navigation/core";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import {
  applyNotificationUpdate,
  getHiddenNotificationCategories,
  type NotificationUpdate,
  type NotificationsSettingsPort,
  type NotificationsSettingsValues,
  type NotificationsSideEffects,
} from "@features/flow-settings-notifications";
import { useFeature } from "@features/platform-feature-flags";
import { useDispatch, useSelector } from "~/context/hooks";
import { setNotifications } from "~/actions/settings";
import { trackWithRoute, updateIdentify } from "~/analytics";
import { updateUserPreferences } from "~/notifications/braze";
import { notificationsSelector, trackingEnabledSelector } from "~/reducers/settings";
import { useNotificationsData } from "LLM/features/NotificationsPrompt";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";

/**
 * The Notifications section's settings port: its values from the legacy store, and each change
 * with the side effects of the legacy Notifications screen (`screens/Settings/Notifications`).
 */
export function useNotificationsSettingsAdapter(): NotificationsSettingsPort {
  const dispatch = useDispatch();
  const route = useRoute();
  const notifications = useSelector(notificationsSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const brazePushNotifications = useFeature("brazePushNotifications");
  const transactionsAlerts = useFeature("transactionsAlerts");
  const brazeOptOutIdentityCleanup = useFeature("brazeOptOutIdentityCleanup");
  const { markUserAsOptIn, markUserAsOptOut } = useNotificationsData();
  const { permissionStatus, requestPushNotificationsPermission } = useNotificationsPermission();

  const osPermissionAuthorized = permissionStatus === AuthorizationStatus.AUTHORIZED;
  const isBrazeOptOutIdentityCleanupEnabled = brazeOptOutIdentityCleanup?.enabled ?? false;
  const remoteCategories = brazePushNotifications?.params?.notificationsCategories;
  const hiddenCategories = useMemo(
    () => getHiddenNotificationCategories(remoteCategories),
    [remoteCategories],
  );

  const values = useMemo<NotificationsSettingsValues>(
    () => ({
      notifications,
      osPermissionAuthorized,
      hiddenCategories,
      transactionsAlertsEnabled: transactionsAlerts?.enabled ?? false,
    }),
    [notifications, osPermissionAuthorized, hiddenCategories, transactionsAlerts?.enabled],
  );

  const sideEffects = useMemo<NotificationsSideEffects>(
    () => ({
      setNotifications: change => dispatch(setNotifications(change)),
      markUserAsOptIn: () => markUserAsOptIn(),
      markUserAsOptOut: () => markUserAsOptOut(),
      updateIdentify: () => void updateIdentify(),
      updateUserPreferences: preferences =>
        updateUserPreferences(preferences, isTrackedUser, {
          brazeOptOutIdentityCleanup: isBrazeOptOutIdentityCleanupEnabled,
        }),
    }),
    [
      dispatch,
      markUserAsOptIn,
      markUserAsOptOut,
      isTrackedUser,
      isBrazeOptOutIdentityCleanupEnabled,
    ],
  );

  const setValue = useCallback(
    (update: NotificationUpdate) =>
      applyNotificationUpdate(update, { notifications, osPermissionAuthorized }, sideEffects),
    [notifications, osPermissionAuthorized, sideEffects],
  );

  const requestOsPermission = useCallback(() => {
    trackWithRoute("button_clicked", route, { button: "Go to system settings" });
    void requestPushNotificationsPermission();
  }, [route, requestPushNotificationsPermission]);

  return useMemo(
    () => ({ values, setValue, requestOsPermission }),
    [values, setValue, requestOsPermission],
  );
}
