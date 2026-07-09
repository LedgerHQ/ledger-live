import { useCallback } from "react";
import { getNotificationPermissionStatus } from "~/logic/getNotificationPermissionStatus";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import {
  getPushNotificationsDataOfUserFromStorage,
  type InitPushNotificationsDataResult,
  useNotificationsData,
} from "LLM/features/NotificationsPrompt";

/**
 * Loads OS permission status + stored push-notifications user data on app start/foreground,
 * and syncs opt-out state. Shared by {@link NotificationsPromptBootstrap} (app-wide bootstrap)
 * and the onboarding-specific opt-in screen, which needs the same init before deciding
 * whether to skip itself.
 */
export function useInitPushNotificationsData() {
  const { setPermissionStatus } = useNotificationsPermission();
  const {
    notifications,
    initializeNotificationSettingsState,
    syncOptOutState,
    updatePushNotificationsDataOfUserInStateAndStore,
  } = useNotificationsData();

  return useCallback(async (): Promise<InitPushNotificationsDataResult> => {
    initializeNotificationSettingsState();

    const [permission, dataOfUserFromStorage] = await Promise.allSettled([
      getNotificationPermissionStatus(),
      getPushNotificationsDataOfUserFromStorage(),
    ]);

    if (permission.status === "rejected") {
      console.error("Failed to get notification permission status:", permission.reason);
    }

    if (dataOfUserFromStorage.status === "rejected") {
      console.error(
        "Failed to get push notifications user data from storage:",
        dataOfUserFromStorage.reason,
      );
    }

    if (dataOfUserFromStorage.status === "fulfilled") {
      const storedUserData = dataOfUserFromStorage.value;

      if (permission.status === "fulfilled") {
        const osPermissionStatus = permission.value;

        setPermissionStatus(osPermissionStatus);

        syncOptOutState(osPermissionStatus, storedUserData);
        return {
          status: "success",
          storedUserData,
          osPermissionStatus,
          areAppNotificationsEnabled: notifications.areNotificationsAllowed,
        };
      }

      if (permission.status === "rejected") {
        updatePushNotificationsDataOfUserInStateAndStore(storedUserData ?? {});
        return {
          status: "error",
          reason: "Failed to get notification permission status",
        };
      }
    }

    if (dataOfUserFromStorage.status === "rejected" && permission.status === "fulfilled") {
      const osPermissionStatus = permission.value;
      setPermissionStatus(osPermissionStatus);

      return {
        status: "error",
        reason: "Failed to get push notifications user data from storage",
      };
    }

    return {
      status: "error",
      reason:
        "Failed to get push notifications user data from storage and notification permission status",
    };
  }, [
    initializeNotificationSettingsState,
    notifications.areNotificationsAllowed,
    setPermissionStatus,
    syncOptOutState,
    updatePushNotificationsDataOfUserInStateAndStore,
  ]);
}
