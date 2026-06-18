import { useCallback, useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";
import {
  mapFeatureFlagsToNotificationPromptPolicy,
  mapFirebaseAuthorizationStatusToNotificationPermissionStatus,
} from "@features/platform-notification-prompt";
import {
  evaluateAfterActionTrigger,
  evaluateInactivityTrigger,
  type NotificationPromptAfterActionSource,
} from "@domain/entity-notification-prompt";
import { useSelector } from "~/context/hooks";
import { ratingsModalOpenSelector } from "~/reducers/ratings";
import { hasCompletedOnboardingSelector, notificationsSelector } from "~/reducers/settings";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import {
  type InitPushNotificationsDataResult,
  useNotificationsData,
} from "LLM/features/NotificationsPrompt";
import {
  trackAfterActionDecision,
  trackInactivityDecision,
} from "LLM/features/NotificationsPrompt/new/notificationsPromptAnalytics";
import { useNotificationsPromptDrawerScheduler } from "LLM/features/NotificationsPrompt/new/hooks/useNotificationsPromptDrawerScheduler";

export function useNotificationsPromptTriggers() {
  const featureBrazePushNotifications = useFeature("brazePushNotifications");
  const featureNewWordingNotificationsDrawer = useFeature("lwmNewWordingOptInNotificationsDrawer");
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const notifications = useSelector(notificationsSelector);
  const isRatingsModalOpen = useSelector(ratingsModalOpenSelector);
  const { permissionStatus } = useNotificationsPermission();
  const { pushNotificationsDataOfUser } = useNotificationsData();
  const { openDrawer, isDrawerPending } = useNotificationsPromptDrawerScheduler();
  const policy = useMemo(
    () =>
      mapFeatureFlagsToNotificationPromptPolicy({
        brazePushNotifications: featureBrazePushNotifications,
        lwmNewWordingOptInNotificationsDrawer: featureNewWordingNotificationsDrawer,
      }),
    [featureBrazePushNotifications, featureNewWordingNotificationsDrawer],
  );

  const notifyFlowCompleted = useCallback(
    (source: NotificationPromptAfterActionSource) => {
      const decision = evaluateAfterActionTrigger(
        {
          source,
          permissionStatus:
            mapFirebaseAuthorizationStatusToNotificationPermissionStatus(permissionStatus),
          areNotificationsAllowed: notifications.areNotificationsAllowed,
          transactionsAlertsCategory: notifications.transactionsAlertsCategory,
          history: pushNotificationsDataOfUser,
        },
        {
          policy,
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
      isDrawerPending,
      isRatingsModalOpen,
      notifications.areNotificationsAllowed,
      notifications.transactionsAlertsCategory,
      openDrawer,
      permissionStatus,
      policy,
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
          permissionStatus: mapFirebaseAuthorizationStatusToNotificationPermissionStatus(
            data.osPermissionStatus,
          ),
          areNotificationsAllowed: data.areAppNotificationsEnabled,
          history: data.storedUserData,
          hasCompletedOnboarding,
        },
        {
          policy,
          isRatingsModalOpen,
          isDrawerPending: isDrawerPending(),
        },
      );

      trackInactivityDecision(decision);

      if (
        decision.kind !== "show" ||
        decision.drawerPromptTarget !== "globalPushNotifications"
      ) {
        return;
      }

      openDrawer(decision.source, decision.delayMs, decision.drawerPromptTarget);
    },
    [
      hasCompletedOnboarding,
      isDrawerPending,
      isRatingsModalOpen,
      openDrawer,
      policy,
    ],
  );

  return {
    notifyFlowCompleted,
    tryTriggerPushNotificationDrawerAfterInactivity,
  };
}
