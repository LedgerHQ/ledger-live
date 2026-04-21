import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus, InteractionManager } from "react-native";
import { useSelector, useDispatch } from "~/context/hooks";
import { getNotificationPermissionStatus } from "~/logic/getNotificationPermissionStatus";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import { NotificationsPromptDrawer } from "../screens/NotificationsPromptDrawer";
import { useNotificationsData } from "../hooks/useNotificationsData";
import { getPushNotificationsDataOfUserFromStorage } from "../utils/storage";
import { setNotificationsDrawerSource, setNotificationsModalOpen } from "~/actions/notifications";
import {
  notificationsDrawerSource,
  notificationsModalOpenSelector,
} from "~/reducers/notifications";
import { ratingsModalOpenSelector } from "~/reducers/ratings";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { track } from "~/analytics";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import type { DataOfUser } from "../types";
import type { NotificationsState } from "~/reducers/types";
import type {
  AfterActionTriggerDecision,
  InactivityTriggerDecision,
  NotificationsPromptAfterActionSource,
  NotificationsPromptRepromptDelay,
  NotificationsPromptSource,
} from "../utils/notificationsPromptEngine";
import {
  evaluateAfterActionTrigger,
  evaluateInactivityTrigger,
  getNextRepromptDelay,
} from "../utils/notificationsPromptEngine";

type NotificationsInitResult =
  | {
      status: "success";
      storedUserData: DataOfUser | null;
      osPermissionStatus: NotificationsPromptContextValue["permissionStatus"];
      areAppNotificationsEnabled: boolean | undefined;
    }
  | {
      status: "error";
      reason: string;
    };

type NotificationsPromptContextValue = {
  permissionStatus: ReturnType<typeof useNotificationsPermission>["permissionStatus"];
  areNotificationsAllowed: boolean | undefined;
  requestPushNotificationsPermission: ReturnType<
    typeof useNotificationsPermission
  >["requestPushNotificationsPermission"];
  markUserAsOptIn: ReturnType<typeof useNotificationsData>["markUserAsOptIn"];
  markUserAsOptOut: ReturnType<typeof useNotificationsData>["markUserAsOptOut"];
  updateUserLastInactiveTime: ReturnType<typeof useNotificationsData>["updateUserLastInactiveTime"];
  pushNotificationsDataOfUser: ReturnType<
    typeof useNotificationsData
  >["pushNotificationsDataOfUser"];
  drawerSource: NotificationsState["drawerSource"];
  isPushNotificationsModalOpen: boolean;
  nextRepromptDelay: NotificationsPromptRepromptDelay | null;
  isInitialized: boolean;
  closeDrawer: () => void;
  initPushNotificationsData: () => Promise<NotificationsInitResult>;
  tryTriggerPushNotificationDrawerAfterInactivity: (
    data?: NotificationsInitResult,
  ) => void | Promise<void>;
  notifyFlowCompleted: (source: NotificationsPromptAfterActionSource) => void;
};

const NotificationsPromptContext = React.createContext<NotificationsPromptContextValue | null>(
  null,
);

const AFTER_ACTION_ATTEMPT_EVENT = "attempt_to_trigger_push_notification_drawer_after_action";
const INACTIVITY_ATTEMPT_EVENT = "attempt_to_trigger_push_notification_drawer_after_inactivity";

const trackAfterActionAttempt = (
  action: NotificationsPromptAfterActionSource,
  decision: AfterActionTriggerDecision,
) => {
  track(AFTER_ACTION_ATTEMPT_EVENT, {
    action,
    shouldPrompt: decision.kind === "show",
    skippedReason: decision.kind === "skip" ? decision.reason : undefined,
    variant: decision.variant,
    repromptDelay: decision.nextRepromptDelay,
    dismissedCount: decision.dismissedCount,
  });
};

const trackInactivityAttempt = (decision: InactivityTriggerDecision) => {
  track(INACTIVITY_ATTEMPT_EVENT, {
    source: decision.source,
    shouldPrompt: decision.kind === "show",
    skippedReason: decision.kind === "skip" ? decision.reason : undefined,
    variant: decision.variant,
    repromptDelay: decision.nextRepromptDelay,
    dismissedCount: decision.dismissedCount,
  });
};

export const useNotificationsPromptContext = () => {
  const context = React.useContext(NotificationsPromptContext);

  if (!context) {
    throw new Error(
      "useNotificationsPromptContext must be used within NotificationsPromptProvider",
    );
  }

  return context;
};

export function NotificationsPromptProvider({ children }: { children: React.ReactNode }) {
  const { permissionStatus, requestPushNotificationsPermission, setPermissionStatus } =
    useNotificationsPermission();
  const {
    notifications,
    pushNotificationsDataOfUser,
    markUserAsOptIn,
    markUserAsOptOut,
    initializeNotificationSettingsState,
    syncOptOutState,
    updatePushNotificationsDataOfUserInStateAndStore,
    updateUserLastInactiveTime,
  } = useNotificationsData();

  const featureBrazePushNotifications = useFeature("brazePushNotifications");
  const featureNewWordingNotificationsDrawer = useFeature("lwmNewWordingOptInNotificationsDrawer");

  const isPushNotificationsModalOpen = useSelector(notificationsModalOpenSelector);
  const drawerSource = useSelector(notificationsDrawerSource);
  const isRatingsModalOpen = useSelector(ratingsModalOpenSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const dispatch = useDispatch();

  const [isInitialized, setIsInitialized] = useState(false);
  const eventTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDrawerSourceRef = useRef<NotificationsPromptSource | null>(null);
  const refreshNotificationsStateRef = useRef<() => Promise<NotificationsInitResult> | undefined>(
    () => undefined,
  );

  const nextRepromptDelay = useMemo(
    () =>
      getNextRepromptDelay({
        repromptSchedule: featureBrazePushNotifications?.params?.reprompt_schedule,
        pushNotificationsDataOfUser,
      }),
    [featureBrazePushNotifications?.params?.reprompt_schedule, pushNotificationsDataOfUser],
  );

  const clearPendingTimeout = useCallback(() => {
    if (eventTimeoutRef.current) {
      clearTimeout(eventTimeoutRef.current);
      eventTimeoutRef.current = null;
    }
    pendingDrawerSourceRef.current = null;
  }, []);

  const closeDrawer = useCallback(() => {
    clearPendingTimeout();
    dispatch(setNotificationsModalOpen(false));
    dispatch(setNotificationsDrawerSource(undefined));
  }, [clearPendingTimeout, dispatch]);

  const openDrawer = useCallback(
    (source: NotificationsPromptSource, delayMs: number) => {
      pendingDrawerSourceRef.current = source;

      eventTimeoutRef.current = setTimeout(() => {
        pendingDrawerSourceRef.current = null;
        eventTimeoutRef.current = null;
        dispatch(setNotificationsModalOpen(true));
        dispatch(setNotificationsDrawerSource(source));
      }, delayMs);
    },
    [dispatch],
  );

  const initPushNotificationsData = useCallback(async (): Promise<NotificationsInitResult> => {
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

      updatePushNotificationsDataOfUserInStateAndStore(storedUserData ?? {});
      return {
        status: "error",
        reason: "Failed to get notification permission status",
      };
    }

    if (permission.status === "fulfilled") {
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

  const tryTriggerPushNotificationDrawerAfterInactivity = useCallback(
    (data?: NotificationsInitResult) => {
      if (data?.status === "error") {
        return;
      }

      const decision = evaluateInactivityTrigger(
        {
          permissionStatus: data?.status === "success" ? data.osPermissionStatus : permissionStatus,
          areNotificationsAllowed:
            data?.status === "success"
              ? data.areAppNotificationsEnabled
              : notifications.areNotificationsAllowed,
          pushNotificationsDataOfUser:
            data?.status === "success" ? data.storedUserData : pushNotificationsDataOfUser,
          hasCompletedOnboarding,
        },
        {
          brazePushNotifications: featureBrazePushNotifications,
          wordingFeature: featureNewWordingNotificationsDrawer,
          isRatingsModalOpen,
          isDrawerPending: isPushNotificationsModalOpen || pendingDrawerSourceRef.current !== null,
        },
      );

      trackInactivityAttempt(decision);

      if (decision.kind === "show") {
        openDrawer(decision.source, decision.delayMs);
      }
    },
    [
      permissionStatus,
      notifications.areNotificationsAllowed,
      pushNotificationsDataOfUser,
      featureBrazePushNotifications,
      featureNewWordingNotificationsDrawer,
      hasCompletedOnboarding,
      isRatingsModalOpen,
      isPushNotificationsModalOpen,
      openDrawer,
    ],
  );

  const refreshNotificationsState = useCallback(async () => {
    const result = await initPushNotificationsData();
    tryTriggerPushNotificationDrawerAfterInactivity(result);
    setIsInitialized(true);
    return result;
  }, [initPushNotificationsData, tryTriggerPushNotificationDrawerAfterInactivity]);

  useEffect(() => {
    refreshNotificationsStateRef.current = refreshNotificationsState;
  }, [refreshNotificationsState]);

  const notifyFlowCompleted = useCallback(
    (source: NotificationsPromptAfterActionSource) => {
      const decision = evaluateAfterActionTrigger(
        {
          source,
          permissionStatus,
          areNotificationsAllowed: notifications.areNotificationsAllowed,
          pushNotificationsDataOfUser,
        },
        {
          brazePushNotifications: featureBrazePushNotifications,
          wordingFeature: featureNewWordingNotificationsDrawer,
          isRatingsModalOpen,
          isDrawerPending: isPushNotificationsModalOpen || pendingDrawerSourceRef.current !== null,
        },
      );

      trackAfterActionAttempt(source, decision);

      if (decision.kind === "show") {
        InteractionManager.runAfterInteractions(() => {
          openDrawer(decision.source, decision.delayMs);
        });
      }
    },
    [
      permissionStatus,
      notifications.areNotificationsAllowed,
      pushNotificationsDataOfUser,
      featureBrazePushNotifications,
      featureNewWordingNotificationsDrawer,
      isRatingsModalOpen,
      isPushNotificationsModalOpen,
      openDrawer,
    ],
  );

  useEffect(() => {
    void refreshNotificationsStateRef.current();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        void refreshNotificationsStateRef.current();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    return () => {
      clearPendingTimeout();
    };
  }, [clearPendingTimeout]);

  const value = useMemo<NotificationsPromptContextValue>(
    () => ({
      permissionStatus,
      areNotificationsAllowed: notifications.areNotificationsAllowed,
      requestPushNotificationsPermission,
      markUserAsOptIn,
      markUserAsOptOut,
      updateUserLastInactiveTime,
      pushNotificationsDataOfUser,
      drawerSource,
      isPushNotificationsModalOpen,
      nextRepromptDelay,
      isInitialized,
      closeDrawer,
      initPushNotificationsData,
      tryTriggerPushNotificationDrawerAfterInactivity,
      notifyFlowCompleted,
    }),
    [
      permissionStatus,
      notifications.areNotificationsAllowed,
      requestPushNotificationsPermission,
      markUserAsOptIn,
      markUserAsOptOut,
      updateUserLastInactiveTime,
      pushNotificationsDataOfUser,
      drawerSource,
      isPushNotificationsModalOpen,
      nextRepromptDelay,
      isInitialized,
      closeDrawer,
      initPushNotificationsData,
      tryTriggerPushNotificationDrawerAfterInactivity,
      notifyFlowCompleted,
    ],
  );

  return (
    <NotificationsPromptContext.Provider value={value}>
      {children}
      {featureBrazePushNotifications?.enabled ? <NotificationsPromptDrawer /> : null}
    </NotificationsPromptContext.Provider>
  );
}
