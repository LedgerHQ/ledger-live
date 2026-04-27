import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { getNotificationPermissionStatus } from "~/logic/getNotificationPermissionStatus";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import { useSelector } from "~/context/hooks";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import {
  getPushNotificationsDataOfUserFromStorage,
  type InitPushNotificationsDataResult,
  useNotificationsContext,
  useNotificationsData,
} from "LLM/features/NotificationsPrompt";

export function NotificationsPromptBootstrap() {
  const { onInitialDataLoaded } = useNotificationsContext();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const { setPermissionStatus } = useNotificationsPermission();
  const {
    notifications,
    initializeNotificationSettingsState,
    syncOptOutState,
    updatePushNotificationsDataOfUserInStateAndStore,
  } = useNotificationsData();

  const initPushNotificationsData =
    useCallback(async (): Promise<InitPushNotificationsDataResult> => {
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

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      return;
    }

    let isCurrentEffect = true;
    initPushNotificationsData().then(data => {
      if (isCurrentEffect) {
        onInitialDataLoaded(data);
      }
    });

    return () => {
      isCurrentEffect = false;
    };

    // Run this effect only once
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") {
        initPushNotificationsData();
      }
    });

    return () => subscription.remove();
  }, [initPushNotificationsData]);

  return null;
}
