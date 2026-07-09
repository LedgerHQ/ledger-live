import { useCallback } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
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
import { notificationsSelector } from "~/reducers/settings";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import { useNotificationsData } from "LLM/features/NotificationsPrompt";
import { useNextRepromptDelay } from "./useNextRepromptDelay";
import { resolveDrawerPromptTargetForAnalytics } from "../notificationsPromptAnalytics";
import { isTransactionsAlertsPromptTarget } from "../../utils/getNotificationsPromptCopy";

/**
 * Drives the push-notifications opt-in drawer's own button presses (allow / maybe later /
 * backdrop). Triggering the drawer itself (deciding whether/when it should open) lives in
 * {@link useNotificationsPromptTriggers}; this hook only reacts to what the user does once
 * it's already open.
 */
export function useNotificationsPromptDrawerHandlers() {
  const dispatch = useDispatch();
  const notifications = useSelector(notificationsSelector);
  const isPushNotificationsModalOpen = useSelector(notificationsModalOpenSelector);
  const drawerSource = useSelector(notificationsDrawerSource);
  const drawerPromptTarget = useSelector(notificationsDrawerPromptTarget);

  const { permissionStatus, requestPushNotificationsPermission } = useNotificationsPermission();
  const {
    pushNotificationsDataOfUser,
    enableAppNotifications,
    markUserAsOptIn,
    markUserAsOptOut,
    updateUserLastInactiveTime,
  } = useNotificationsData();

  const nextRepromptDelay = useNextRepromptDelay();

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
    nextRepromptDelay,
    pushNotificationsDataOfUser,
    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
  };
}
