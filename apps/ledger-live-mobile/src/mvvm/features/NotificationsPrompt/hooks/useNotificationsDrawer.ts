import { useCallback, useRef } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { useFeature } from "@features/platform-feature-flags";
import {
  setNotificationsDrawerPromptTarget,
  setNotificationsDrawerSource,
  setNotificationsModalOpen,
} from "~/actions/notifications";
import { setNotifications } from "~/actions/settings";
import { track } from "~/analytics";
import { updateUserPreferences } from "~/notifications/braze";
import {
  notificationsDrawerPromptTarget,
  notificationsDrawerSource,
  notificationsModalOpenSelector,
} from "~/reducers/notifications";
import { ratingsModalOpenSelector } from "~/reducers/ratings";
import { notificationsSelector } from "~/reducers/settings";
import { type NotificationsState } from "~/reducers/types";
import { type DataOfUser, type NotificationPromptTarget } from "../types";
import { resolveDrawerPromptTargetForAnalytics } from "../new/notificationsPromptAnalytics";
import { isTransactionsAlertsPromptTarget } from "../utils/getNotificationsPromptCopy";

type UseNotificationsDrawerParams = {
  permissionStatus:
    | (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]
    | null
    | undefined;
  pushNotificationsDataOfUser: DataOfUser | null | undefined;
  nextRepromptDelay: { days?: number; hours?: number; minutes?: number } | null;
  checkIsInactive: (lastActionAt?: number) => boolean;
  markUserAsOptIn: () => void;
  markUserAsOptOut: (promptTarget?: NotificationPromptTarget) => void;
  enableAppNotifications: () => void;
  updateUserLastInactiveTime: () => void;
  requestPushNotificationsPermission: () => Promise<
    void | (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus]
  >;
};

export const useNotificationsDrawer = ({
  permissionStatus,
  pushNotificationsDataOfUser,
  nextRepromptDelay,
  checkIsInactive,
  markUserAsOptIn,
  markUserAsOptOut,
  enableAppNotifications,
  requestPushNotificationsPermission,
  updateUserLastInactiveTime,
}: UseNotificationsDrawerParams) => {
  const featureBrazePushNotifications = useFeature("brazePushNotifications");

  const isPushNotificationsModalOpen = useSelector(notificationsModalOpenSelector);
  const isRatingsModalOpen = useSelector(ratingsModalOpenSelector);
  const drawerSource = useSelector(notificationsDrawerSource);
  const drawerPromptTarget = useSelector(notificationsDrawerPromptTarget);
  const notifications = useSelector(notificationsSelector);

  const dispatch = useDispatch();
  const eventTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openDrawer = useCallback(
    (drawerSource: Exclude<NotificationsState["drawerSource"], undefined>, timer = 0) => {
      if (eventTimeoutRef.current) {
        clearTimeout(eventTimeoutRef.current);
        eventTimeoutRef.current = null;
      }

      eventTimeoutRef.current = setTimeout(() => {
        dispatch(setNotificationsModalOpen(true));
        dispatch(setNotificationsDrawerSource(drawerSource));
      }, timer);
    },
    [dispatch],
  );

  const tryTriggerPushNotificationDrawerAfterInactivity = useCallback(
    (
      data:
        | {
            status: "success";
            storedUserData: DataOfUser | null;
            osPermissionStatus: (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];
            areAppNotificationsEnabled: boolean;
          }
        | {
            status: "error";
            reason: string;
          },
    ) => {
      if (!featureBrazePushNotifications?.enabled || isRatingsModalOpen) {
        return;
      }
      if (data.status === "error") {
        return;
      }

      const isOptOut =
        data.osPermissionStatus !== AuthorizationStatus.AUTHORIZED ||
        !data.areAppNotificationsEnabled;
      if (!isOptOut) {
        return;
      }

      const isInactive = checkIsInactive(data.storedUserData?.lastActionAt);
      if (isInactive) {
        openDrawer("inactivity", 1000);
      }
    },
    [featureBrazePushNotifications?.enabled, isRatingsModalOpen, openDrawer, checkIsInactive],
  );

  const trackButtonClicked = useCallback(
    (eventName: string) => {
      track("button_clicked", {
        button: eventName,
        page: "Drawer push notification opt-in",
        source: drawerSource,
        drawerPromptTarget: resolveDrawerPromptTargetForAnalytics(drawerPromptTarget),
        repromptDelay: nextRepromptDelay,
        dismissedCount: pushNotificationsDataOfUser?.dismissedOptInDrawerAtList?.length ?? 0,
      });
    },
    [
      drawerSource,
      drawerPromptTarget,
      nextRepromptDelay,
      pushNotificationsDataOfUser?.dismissedOptInDrawerAtList,
    ],
  );

  const closeDrawer = useCallback(() => {
    dispatch(setNotificationsModalOpen(false));
    dispatch(setNotificationsDrawerSource(undefined));
    dispatch(setNotificationsDrawerPromptTarget(undefined));
  }, [dispatch]);

  const handleDelayLaterPress = useCallback(() => {
    const promptTargetAtDismiss = drawerPromptTarget;
    trackButtonClicked("maybe later");
    closeDrawer();

    if (drawerSource === "inactivity") {
      updateUserLastInactiveTime();
    } else {
      markUserAsOptOut(promptTargetAtDismiss);
    }
  }, [
    trackButtonClicked,
    closeDrawer,
    drawerPromptTarget,
    markUserAsOptOut,
    updateUserLastInactiveTime,
    drawerSource,
  ]);

  const handleCloseFromBackdropPress = useCallback(() => {
    const promptTargetAtDismiss = drawerPromptTarget;
    trackButtonClicked("backdrop");
    closeDrawer();

    if (drawerSource === "inactivity") {
      updateUserLastInactiveTime();
    } else {
      markUserAsOptOut(promptTargetAtDismiss);
    }
  }, [
    trackButtonClicked,
    closeDrawer,
    drawerPromptTarget,
    markUserAsOptOut,
    updateUserLastInactiveTime,
    drawerSource,
  ]);

  const handleAllowNotificationsPress = useCallback(async () => {
    const promptTargetAtDismiss = drawerPromptTarget;
    trackButtonClicked("allow notifications");
    closeDrawer();

    if (drawerSource === "inactivity") {
      updateUserLastInactiveTime();
    }

    if (isTransactionsAlertsPromptTarget(promptTargetAtDismiss)) {
      dispatch(
        setNotifications({
          transactionsAlertsCategory: true,
        }),
      );
      updateUserPreferences({
        ...notifications,
        transactionsAlertsCategory: true,
      });
      markUserAsOptIn();
      return;
    }

    enableAppNotifications();

    let permission = permissionStatus;
    if (permissionStatus !== AuthorizationStatus.AUTHORIZED) {
      const requestedPermission = await requestPushNotificationsPermission();
      permission = requestedPermission ?? permissionStatus;
    }

    if (permission === AuthorizationStatus.DENIED) {
      trackButtonClicked("os_notifications_deny");
      markUserAsOptOut(promptTargetAtDismiss);
      return;
    }

    if (permission === AuthorizationStatus.AUTHORIZED) {
      trackButtonClicked("os_notifications_allow");
      markUserAsOptIn();
    }
  }, [
    trackButtonClicked,
    updateUserLastInactiveTime,
    closeDrawer,
    drawerPromptTarget,
    dispatch,
    notifications,
    permissionStatus,
    requestPushNotificationsPermission,
    drawerSource,
    enableAppNotifications,
    markUserAsOptIn,
    markUserAsOptOut,
  ]);

  return {
    isPushNotificationsModalOpen,
    drawerSource,
    drawerPromptTarget,
    eventTimeoutRef,
    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
    tryTriggerPushNotificationDrawerAfterInactivity,
  };
};
