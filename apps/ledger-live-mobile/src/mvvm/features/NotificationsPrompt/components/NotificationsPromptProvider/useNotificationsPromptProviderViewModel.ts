import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFeature } from "@features/platform-feature-flags";
import {
  buildAfterActionDecisionAnalytics,
  buildInactivityDecisionAnalytics,
  mapFeatureFlagsToNotificationPromptPolicy,
  mapFirebaseAuthorizationStatusToNotificationPermissionStatus,
} from "@features/platform-notification-prompt";
import type { NotificationsPromptContextValue as FlowNotificationsPromptContextValue } from "@features/flow-notification-prompt";
import {
  evaluateAfterActionTrigger,
  evaluateInactivityTrigger,
  type NotificationPromptAfterActionSource,
  type NotificationPromptSource,
  type NotificationPromptTarget,
} from "@domain/entity-notification-prompt";
import {
  setNotificationsDrawerPromptTarget,
  setNotificationsDrawerSource,
  setNotificationsModalOpen,
} from "~/actions/notifications";
import { track } from "~/analytics";
import { useDispatch, useSelector } from "~/context/hooks";
import { notificationsModalOpenSelector } from "~/reducers/notifications";
import { ratingsModalOpenSelector } from "~/reducers/ratings";
import { hasCompletedOnboardingSelector, notificationsSelector } from "~/reducers/settings";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import {
  type InitPushNotificationsDataResult,
  useNotificationsData,
} from "LLM/features/NotificationsPrompt";

type NotificationsPromptContextValue =
  FlowNotificationsPromptContextValue<InitPushNotificationsDataResult>;

export function useNotificationsPromptProviderViewModel(): NotificationsPromptContextValue {
  const featureBrazePushNotifications = useFeature("brazePushNotifications");
  const featureNewWordingNotificationsDrawer = useFeature("lwmNewWordingOptInNotificationsDrawer");
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const notifications = useSelector(notificationsSelector);
  const isRatingsModalOpen = useSelector(ratingsModalOpenSelector);
  const isPushNotificationsModalOpen = useSelector(notificationsModalOpenSelector);
  const { permissionStatus } = useNotificationsPermission();
  const { pushNotificationsDataOfUser } = useNotificationsData();
  const dispatch = useDispatch();
  const eventTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const policy = useMemo(
    () =>
      mapFeatureFlagsToNotificationPromptPolicy({
        brazePushNotifications: featureBrazePushNotifications,
        lwmNewWordingOptInNotificationsDrawer: featureNewWordingNotificationsDrawer,
      }),
    [featureBrazePushNotifications, featureNewWordingNotificationsDrawer],
  );

  const openDrawer = useCallback(
    (
      source: NotificationPromptSource,
      timer = 0,
      drawerPromptTarget?: NotificationPromptTarget,
    ) => {
      if (eventTimeoutRef.current) {
        clearTimeout(eventTimeoutRef.current);
        eventTimeoutRef.current = null;
      }

      eventTimeoutRef.current = setTimeout(() => {
        eventTimeoutRef.current = null;
        const resolvedPromptTarget =
          source === "inactivity" ? "globalPushNotifications" : drawerPromptTarget;

        dispatch(setNotificationsDrawerSource(source));
        dispatch(setNotificationsDrawerPromptTarget(resolvedPromptTarget));
        dispatch(setNotificationsModalOpen(true));
      }, timer);
    },
    [dispatch],
  );

  const isDrawerPending = useCallback(
    () => isPushNotificationsModalOpen || eventTimeoutRef.current !== null,
    [isPushNotificationsModalOpen],
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
      const analytics = buildAfterActionDecisionAnalytics(decision);

      track(analytics.event, analytics.properties);

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
      const analytics = buildInactivityDecisionAnalytics(decision);

      track(analytics.event, analytics.properties);

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

  useEffect(() => {
    return () => {
      if (eventTimeoutRef.current) {
        clearTimeout(eventTimeoutRef.current);
        eventTimeoutRef.current = null;
      }
    };
  }, []);

  return useMemo(
    () => ({
      notifyFlowCompleted,
      tryTriggerPushNotificationDrawerAfterInactivity,
    }),
    [notifyFlowCompleted, tryTriggerPushNotificationDrawerAfterInactivity],
  );
}
