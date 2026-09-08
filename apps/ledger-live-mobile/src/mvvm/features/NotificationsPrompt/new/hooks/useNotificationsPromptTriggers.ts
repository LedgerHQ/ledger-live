import { useCallback } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { ratingsModalOpenSelector } from "~/reducers/ratings";
import { hasCompletedOnboardingSelector, notificationsSelector } from "~/reducers/settings";
import { getNotificationPermissionStatus } from "~/logic/getNotificationPermissionStatus";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import {
  evaluateAfterActionTrigger,
  evaluateInactivityTrigger,
  getPushNotificationsDataOfUserFromStorage,
  type InitPushNotificationsDataResult,
  type NotificationsPromptAfterActionSource,
  useNotificationsData,
} from "LLM/features/NotificationsPrompt";
import {
  trackAfterActionDecision,
  trackInactivityDecision,
} from "LLM/features/NotificationsPrompt/new/notificationsPromptAnalytics";
import { useNotificationsPromptDrawerScheduler } from "LLM/features/NotificationsPrompt/new/hooks/useNotificationsPromptDrawerScheduler";

export function useNotificationsPromptTriggers() {
  const featureBrazePushNotifications = useFeature("brazePushNotifications");
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const notifications = useSelector(notificationsSelector);
  const isRatingsModalOpen = useSelector(ratingsModalOpenSelector);
  const { permissionStatus, setPermissionStatus } = useNotificationsPermission();
  const {
    pushNotificationsDataOfUser,
    initializeNotificationSettingsState,
    syncOptOutState,
    updatePushNotificationsDataOfUserInStateAndStore,
  } = useNotificationsData();
  const { openDrawer, isDrawerPending, cancelPendingDrawer } =
    useNotificationsPromptDrawerScheduler();

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

  const notifyFlowCompleted = useCallback(
    (source: NotificationsPromptAfterActionSource) => {
      const decision = evaluateAfterActionTrigger(
        {
          source,
          permissionStatus,
          areNotificationsAllowed: notifications.areNotificationsAllowed,
          transactionsAlertsCategory: notifications.transactionsAlertsCategory,
          pushNotificationsDataOfUser,
        },
        {
          brazePushNotifications: featureBrazePushNotifications,
          isRatingsModalOpen,
          isDrawerPending: isDrawerPending(),
        },
      );

      trackAfterActionDecision(decision);

      if (decision.kind === "skip") {
        return;
      }

      openDrawer(decision.source, decision.delayMs, decision.drawerPromptTarget);
    },
    [
      featureBrazePushNotifications,
      isDrawerPending,
      isRatingsModalOpen,
      notifications.areNotificationsAllowed,
      notifications.transactionsAlertsCategory,
      openDrawer,
      permissionStatus,
      pushNotificationsDataOfUser,
    ],
  );

  const tryTriggerPushNotificationDrawerAfterInactivity = useCallback(
    (data: InitPushNotificationsDataResult) => {
      if (data.status === "error") {
        return;
      }

      const decision = evaluateInactivityTrigger(
        {
          permissionStatus: data.osPermissionStatus,
          areNotificationsAllowed: data.areAppNotificationsEnabled,
          pushNotificationsDataOfUser: data.storedUserData,
          hasCompletedOnboarding,
        },
        {
          brazePushNotifications: featureBrazePushNotifications,
          isRatingsModalOpen,
          isDrawerPending: isDrawerPending(),
        },
      );

      trackInactivityDecision(decision);

      if (decision.kind !== "show" || decision.drawerPromptTarget !== "globalPushNotifications") {
        return;
      }

      openDrawer(decision.source, decision.delayMs, decision.drawerPromptTarget);
    },
    [
      featureBrazePushNotifications,
      hasCompletedOnboarding,
      isDrawerPending,
      isRatingsModalOpen,
      openDrawer,
    ],
  );

  return {
    notifyFlowCompleted,
    tryTriggerPushNotificationDrawerAfterInactivity,
    initPushNotificationsData,
    openDrawer,
    isDrawerPending,
    cancelPendingDrawer,
  };
}
