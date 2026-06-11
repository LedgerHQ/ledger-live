import { useCallback } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { ratingsModalOpenSelector } from "~/reducers/ratings";
import { hasCompletedOnboardingSelector, notificationsSelector } from "~/reducers/settings";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import {
  evaluateAfterActionTrigger,
  evaluateInactivityTrigger,
  type InitPushNotificationsDataResult,
  type NotificationsPromptAfterActionSource,
  useNotificationsData,
  useNotificationsPrompt,
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
  const { shouldPromptOptInDrawerAfterAction } = useNotificationsPrompt({
    permissionStatus,
    areNotificationsAllowed: notifications.areNotificationsAllowed,
    transactionsAlertsCategory: notifications.transactionsAlertsCategory,
    pushNotificationsDataOfUser,
  });
  const { openDrawer, isDrawerPending } = useNotificationsPromptDrawerScheduler();

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
          wordingFeature: featureNewWordingNotificationsDrawer,
          isRatingsModalOpen,
          isDrawerPending: isDrawerPending(),
        },
      );

      trackAfterActionDecision(decision, shouldPromptOptInDrawerAfterAction);

      if (decision.kind === "skip") {
        return;
      }

      openDrawer(decision.source, decision.delayMs, decision.drawerPromptTarget);
    },
    [
      featureBrazePushNotifications,
      featureNewWordingNotificationsDrawer,
      isDrawerPending,
      isRatingsModalOpen,
      notifications.areNotificationsAllowed,
      notifications.transactionsAlertsCategory,
      openDrawer,
      permissionStatus,
      pushNotificationsDataOfUser,
      shouldPromptOptInDrawerAfterAction,
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
          wordingFeature: featureNewWordingNotificationsDrawer,
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
      featureBrazePushNotifications,
      featureNewWordingNotificationsDrawer,
      hasCompletedOnboarding,
      isDrawerPending,
      isRatingsModalOpen,
      openDrawer,
    ],
  );

  return {
    notifyFlowCompleted,
    tryTriggerPushNotificationDrawerAfterInactivity,
  };
}
