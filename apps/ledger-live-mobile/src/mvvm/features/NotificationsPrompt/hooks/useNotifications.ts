import { useCallback, useEffect } from "react";
import { getNotificationPermissionStatus } from "~/logic/getNotificationPermissionStatus";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";
import { useNotificationsData } from "./useNotificationsData";
import { useNotificationsPrompt } from "./useNotificationsPrompt";
import { useNotificationsDrawer } from "./useNotificationsDrawer";
import { getPushNotificationsDataOfUserFromStorage } from "../utils/storage";

const useNotifications = () => {
  const { permissionStatus, requestPushNotificationsPermission, setPermissionStatus } =
    useNotificationsPermission();

  const {
    notifications,
    pushNotificationsDataOfUser,
    enableAppNotifications,
    markUserAsOptIn,
    markUserAsOptOut,
    initializeNotificationSettingsState,
    syncOptOutState,
    updatePushNotificationsDataOfUserInStateAndStore,
    updateUserLastInactiveTime,
  } = useNotificationsData();

  const { nextRepromptDelay, shouldPromptOptInDrawerAfterAction, checkIsInactive } =
    useNotificationsPrompt({
      permissionStatus,
      areNotificationsAllowed: notifications.areNotificationsAllowed,
      transactionsAlertsCategory: notifications.transactionsAlertsCategory,
      pushNotificationsDataOfUser,
    });

  const {
    isPushNotificationsModalOpen,
    drawerSource,
    drawerPromptTarget,
    eventTimeoutRef,
    tryTriggerPushNotificationDrawerAfterAction,
    tryTriggerPushNotificationDrawerAfterInactivity,
    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
  } = useNotificationsDrawer({
    permissionStatus,
    pushNotificationsDataOfUser,
    nextRepromptDelay,
    shouldPromptOptInDrawerAfterAction,
    updateUserLastInactiveTime,
    checkIsInactive,
    markUserAsOptOut,
    markUserAsOptIn,
    enableAppNotifications,
    requestPushNotificationsPermission,
  });

  const initPushNotificationsData = useCallback(async () => {
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

  useEffect(() => {
    return () => {
      if (eventTimeoutRef.current) {
        clearTimeout(eventTimeoutRef.current);
        eventTimeoutRef.current = null;
      }
    };
  }, [eventTimeoutRef]);

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
    shouldPromptOptInDrawerAfterAction,
    tryTriggerPushNotificationDrawerAfterAction,
    // Call only on stack navigators where onboarding is already complete.
    tryTriggerPushNotificationDrawerAfterInactivity,
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
