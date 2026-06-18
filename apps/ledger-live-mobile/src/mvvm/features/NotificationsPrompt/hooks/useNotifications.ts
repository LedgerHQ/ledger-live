import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/core";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { useFeature } from "@features/platform-feature-flags";
import {
  getPushNotificationsDataOfUserFromStorage,
  mapFeatureFlagsToNotificationPromptPolicy,
  mapFirebaseAuthorizationStatusToNotificationPermissionStatus,
  resolveDrawerPromptTargetForAnalytics,
} from "@features/platform-notification-prompt";
import { getNextRepromptDelay } from "@domain/entity-notification-prompt";
import { getNotificationPermissionStatus } from "~/logic/getNotificationPermissionStatus";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import storage from "LLM/storage";
import { useNotificationsData } from "./useNotificationsData";
import { useSelector, useDispatch } from "~/context/hooks";
import {
  notificationsDrawerPromptTarget,
  notificationsDrawerSource,
  notificationsModalOpenSelector,
} from "~/reducers/notifications";
import {
  setNotificationsDrawerPromptTarget,
  setNotificationsDrawerSource,
  setNotificationsModalOpen,
} from "~/actions/notifications";
import { setNotifications } from "~/actions/settings";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const/navigation";
import { updateUserPreferences } from "~/notifications/braze";
import { isTransactionsAlertsPromptTarget } from "../utils/getNotificationsPromptCopy";

const useNotifications = () => {
  const featureBrazePushNotifications = useFeature("brazePushNotifications");
  const featureNewWordingNotificationsDrawer = useFeature(
    "lwmNewWordingOptInNotificationsDrawer",
  );
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

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isPushNotificationsModalOpen = useSelector(notificationsModalOpenSelector);
  const drawerSource = useSelector(notificationsDrawerSource);
  const drawerPromptTarget = useSelector(notificationsDrawerPromptTarget);

  const policy = useMemo(
    () =>
      mapFeatureFlagsToNotificationPromptPolicy({
        brazePushNotifications: featureBrazePushNotifications,
        lwmNewWordingOptInNotificationsDrawer: featureNewWordingNotificationsDrawer,
      }),
    [featureBrazePushNotifications, featureNewWordingNotificationsDrawer],
  );

  const nextRepromptDelay = useMemo(
    () =>
      getNextRepromptDelay({
        repromptSchedule: policy.repromptSchedule,
        history: pushNotificationsDataOfUser,
        permissionStatus: mapFirebaseAuthorizationStatusToNotificationPermissionStatus(
          permissionStatus,
        ),
        areNotificationsAllowed: notifications.areNotificationsAllowed,
        transactionsAlertsCategory: notifications.transactionsAlertsCategory,
      }),
    [
      notifications.areNotificationsAllowed,
      notifications.transactionsAlertsCategory,
      permissionStatus,
      policy.repromptSchedule,
      pushNotificationsDataOfUser,
    ],
  );

  const initPushNotificationsData = useCallback(async () => {
    initializeNotificationSettingsState();

    const [permission, dataOfUserFromStorage] = await Promise.allSettled([
      getNotificationPermissionStatus(),
      getPushNotificationsDataOfUserFromStorage(storage),
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
        } as const;
      }

      if (permission.status === "rejected") {
        updatePushNotificationsDataOfUserInStateAndStore(storedUserData ?? {});
        return {
          status: "error",
          reason: "Failed to get notification permission status",
        } as const;
      }
    }

    if (dataOfUserFromStorage.status === "rejected" && permission.status === "fulfilled") {
      const osPermissionStatus = permission.value;
      setPermissionStatus(osPermissionStatus);

      return {
        status: "error",
        reason: "Failed to get push notifications user data from storage",
      } as const;
    }

    return {
      status: "error",
      reason:
        "Failed to get push notifications user data from storage and notification permission status",
    } as const;
  }, [
    initializeNotificationSettingsState,
    notifications.areNotificationsAllowed,
    setPermissionStatus,
    syncOptOutState,
    updatePushNotificationsDataOfUserInStateAndStore,
  ]);

  const trackButtonClicked = useCallback(
    (eventName: string) => {
      const canShowVariant = featureNewWordingNotificationsDrawer?.enabled;

      track("button_clicked", {
        button: eventName,
        page: "Drawer push notification opt-in",
        source: drawerSource,
        drawerPromptTarget: resolveDrawerPromptTargetForAnalytics(drawerPromptTarget),
        repromptDelay: nextRepromptDelay,
        dismissedCount: pushNotificationsDataOfUser?.dismissedOptInDrawerAtList?.length ?? 0,
        variant: canShowVariant ? featureNewWordingNotificationsDrawer?.params?.variant : undefined,
      });
    },
    [
      drawerSource,
      drawerPromptTarget,
      featureNewWordingNotificationsDrawer?.enabled,
      featureNewWordingNotificationsDrawer?.params?.variant,
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
    closeDrawer,
    drawerPromptTarget,
    drawerSource,
    markUserAsOptOut,
    trackButtonClicked,
    updateUserLastInactiveTime,
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
    closeDrawer,
    drawerPromptTarget,
    drawerSource,
    markUserAsOptOut,
    trackButtonClicked,
    updateUserLastInactiveTime,
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

    if (permissionStatus !== AuthorizationStatus.AUTHORIZED) {
      const permission = await requestPushNotificationsPermission();
      if (permission === AuthorizationStatus.DENIED) {
        trackButtonClicked("os_notifications_deny");
        markUserAsOptOut(promptTargetAtDismiss);
      } else if (permission === AuthorizationStatus.AUTHORIZED) {
        trackButtonClicked("os_notifications_allow");
        markUserAsOptIn();
      }
    }

    if (!notifications.areNotificationsAllowed) {
      navigation.navigate(NavigatorName.Settings, {
        screen: ScreenName.NotificationsSettings,
      });
    }
  }, [
    closeDrawer,
    dispatch,
    drawerPromptTarget,
    drawerSource,
    markUserAsOptIn,
    markUserAsOptOut,
    navigation,
    notifications,
    permissionStatus,
    requestPushNotificationsPermission,
    trackButtonClicked,
    updateUserLastInactiveTime,
  ]);

  const permission = {
    permissionStatus,
    requestPushNotificationsPermission,
  };

  const drawer = {
    isPushNotificationsModalOpen,
    drawerSource,
    drawerPromptTarget,
    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
  };

  const prompt = {
    nextRepromptDelay,
    pushNotificationsDataOfUser,
  };

  const userState = {
    markUserAsOptIn,
    markUserAsOptOut,
  };

  return {
    initPushNotificationsData,
    ...permission,
    ...drawer,
    ...prompt,
    ...userState,
  };
};

export { useNotifications };
